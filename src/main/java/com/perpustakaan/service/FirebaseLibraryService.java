package com.perpustakaan.service;

import com.perpustakaan.auth.AuthSession;
import com.perpustakaan.firebase.FirebaseClient;
import com.perpustakaan.model.Book;
import com.perpustakaan.model.BorrowedBook;
import com.perpustakaan.model.Loan;
import com.perpustakaan.util.JsonUtil;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class FirebaseLibraryService {
    private static final float BIAYA_PINJAM_BUKU = 2_000F;
    private static final float DENDA_FIKSI_PER_HARI = 2_000F;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final FirebaseClient firebaseClient;

    public FirebaseLibraryService(FirebaseClient firebaseClient) {
        this.firebaseClient = firebaseClient;
    }

    public void tambahBuku(AuthSession session, Book book) {
        if (!session.isAdmin()) {
            throw new IllegalStateException("Hanya admin yang dapat menambah buku.");
        }

        firebaseClient.putDatabase("books/" + book.getId(), session.getIdToken(), bookToJson(book));
    }

    public void kurangiStockBuku(AuthSession session, int idBuku) {
        if (!session.isAdmin()) {
            throw new IllegalStateException("Hanya admin yang dapat mengurangi stock buku.");
        }

        Book book = getBukuById(session, idBuku);
        book.kurangiStock();
        firebaseClient.putDatabase("books/" + book.getId(), session.getIdToken(), bookToJson(book));
    }

    public void hapusBuku(AuthSession session, int idBuku) {
        if (!session.isAdmin()) {
            throw new IllegalStateException("Hanya admin yang dapat menghapus buku.");
        }

        getBukuById(session, idBuku);
        firebaseClient.deleteDatabase("books/" + idBuku, session.getIdToken());
    }

    public void tampilkanDaftarBuku(AuthSession session) {
        List<Book> daftarBuku = getDaftarBuku(session);
        if (daftarBuku.isEmpty()) {
            System.out.println("Belum ada buku di perpustakaan.");
            return;
        }

        daftarBuku.forEach(book -> System.out.println(book.getInfo()));
    }

    public Loan pinjamBuku(AuthSession session, int idBuku, int lamaHari) {
        if (lamaHari <= 0) {
            throw new IllegalArgumentException("Lama peminjaman harus lebih dari 0 hari.");
        }

        Book book = getBukuById(session, idBuku);
        book.kurangiStock();

        firebaseClient.putDatabase("books/" + book.getId(), session.getIdToken(), bookToJson(book));

        LocalDate tanggalPinjam = LocalDate.now();
        LocalDate tanggalPengembalian = tanggalPinjam.plusDays(lamaHari);
        String loanJson = "{"
                + "\"memberUid\":" + JsonUtil.quote(session.getUid()) + ","
                + "\"memberName\":" + JsonUtil.quote(session.getName()) + ","
                + "\"memberEmail\":" + JsonUtil.quote(session.getEmail()) + ","
                + "\"bookId\":" + book.getId() + ","
                + "\"bookTitle\":" + JsonUtil.quote(book.getJudul()) + ","
                + "\"bookJenis\":" + JsonUtil.quote(book.getJenis()) + ","
                + "\"borrowDate\":" + JsonUtil.quote(tanggalPinjam.format(DATE_FORMATTER)) + ","
                + "\"borrowDays\":" + lamaHari + ","
                + "\"dueDate\":" + JsonUtil.quote(tanggalPengembalian.format(DATE_FORMATTER)) + ","
                + "\"totalHarga\":" + BIAYA_PINJAM_BUKU + ","
                + "\"paid\":false,"
                + "\"fine\":0,"
                + "\"returned\":false"
                + "}";
        String loanId = String.valueOf(book.getId());
        firebaseClient.putDatabase("loans/" + loanId, session.getIdToken(), loanJson);

        return new Loan(
                loanId,
                session.getUid(),
                book,
                BIAYA_PINJAM_BUKU,
                false,
                tanggalPengembalian.format(DATE_FORMATTER)
        );
    }

    public void prosesPembayaran(AuthSession session, Loan loan, float jumlahBayar) {
        loan.prosesPembayaran(jumlahBayar);
        firebaseClient.putDatabase("loans/" + loan.getIdLoan() + "/paid", session.getIdToken(), "true");
    }

    public void tampilkanDaftarPeminjaman(AuthSession session) {
        if (!session.isAdmin()) {
            throw new IllegalStateException("Hanya admin yang dapat melihat semua peminjaman.");
        }

        List<BorrowedBook> daftarPeminjaman = getDaftarPeminjaman(session);
        if (daftarPeminjaman.isEmpty()) {
            System.out.println("Belum ada buku yang dipinjam.");
            return;
        }

        daftarPeminjaman.forEach(item -> System.out.println(item.getInfo()));
    }

    public void tampilkanPeminjamanMember(AuthSession session) {
        List<BorrowedBook> daftarPeminjaman = getDaftarPeminjaman(session).stream()
                .filter(item -> session.getUid().equals(item.getMemberUid()))
                .collect(Collectors.toList());

        if (daftarPeminjaman.isEmpty()) {
            System.out.println("Kamu belum memiliki peminjaman buku.");
            return;
        }

        daftarPeminjaman.forEach(item -> System.out.println(item.getInfo()));
    }

    public float kembalikanBuku(AuthSession session, String loanId) {
        BorrowedBook borrowedBook = getPeminjamanById(session, loanId);
        if (!session.getUid().equals(borrowedBook.getMemberUid())) {
            throw new IllegalStateException("Kamu hanya dapat mengembalikan buku yang kamu pinjam.");
        }

        if (borrowedBook.isReturned()) {
            throw new IllegalStateException("Buku ini sudah dikembalikan.");
        }

        Book book = getBukuById(session, borrowedBook.getBookId());
        Book updatedBook = new Book(book.getId(), book.getJudul(), book.getJenis(), book.getStock() + 1);
        LocalDate tanggalKembali = LocalDate.now();
        float denda = hitungDenda(borrowedBook, tanggalKembali);

        firebaseClient.putDatabase("books/" + updatedBook.getId(), session.getIdToken(), bookToJson(updatedBook));
        firebaseClient.putDatabase("loans/" + loanId + "/returned", session.getIdToken(), "true");
        firebaseClient.putDatabase(
                "loans/" + loanId + "/returnDate",
                session.getIdToken(),
                JsonUtil.quote(tanggalKembali.format(DATE_FORMATTER))
        );
        firebaseClient.putDatabase("loans/" + loanId + "/fine", session.getIdToken(), String.valueOf(denda));
        return denda;
    }

    private List<Book> getDaftarBuku(AuthSession session) {
        String response = firebaseClient.getDatabase("books", session.getIdToken());
        List<Book> daftarBuku = new ArrayList<>();

        if (response == null || response.equals("null")) {
            return daftarBuku;
        }

        Matcher matcher = Pattern.compile("\\{([^{}]*)\\}").matcher(response);
        while (matcher.find()) {
            daftarBuku.add(bookFromJson(matcher.group(1)));
        }

        return daftarBuku;
    }

    private Book getBukuById(AuthSession session, int idBuku) {
        String response = firebaseClient.getDatabase("books/" + idBuku, session.getIdToken());
        if (response == null || response.equals("null")) {
            throw new IllegalArgumentException("Buku tidak ditemukan.");
        }

        return bookFromJson(response);
    }

    private List<BorrowedBook> getDaftarPeminjaman(AuthSession session) {
        String response = firebaseClient.getDatabase("loans", session.getIdToken());
        List<BorrowedBook> daftarPeminjaman = new ArrayList<>();

        if (response == null || response.equals("null")) {
            return daftarPeminjaman;
        }

        Matcher matcher = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\\{([^{}]*)\\}").matcher(response);
        while (matcher.find()) {
            daftarPeminjaman.add(borrowedBookFromJson(matcher.group(1), matcher.group(2)));
        }

        return daftarPeminjaman;
    }

    private BorrowedBook getPeminjamanById(AuthSession session, String loanId) {
        String response = firebaseClient.getDatabase("loans/" + loanId, session.getIdToken());
        if (response == null || response.equals("null")) {
            throw new IllegalArgumentException("Data peminjaman tidak ditemukan.");
        }

        return borrowedBookFromJson(loanId, response);
    }

    private String bookToJson(Book book) {
        return "{"
                + "\"id\":" + book.getId() + ","
                + "\"judul\":" + JsonUtil.quote(book.getJudul()) + ","
                + "\"jenis\":" + JsonUtil.quote(book.getJenis()) + ","
                + "\"stock\":" + book.getStock()
                + "}";
    }

    private Book bookFromJson(String json) {
        return new Book(
                JsonUtil.intValue(json, "id"),
                JsonUtil.stringValue(json, "judul"),
                JsonUtil.stringValue(json, "jenis"),
                JsonUtil.intValue(json, "stock")
        );
    }

    private BorrowedBook borrowedBookFromJson(String loanId, String json) {
        return new BorrowedBook(
                loanId,
                JsonUtil.stringValue(json, "memberUid"),
                valueOrDefault(JsonUtil.stringValue(json, "memberName"), "-"),
                JsonUtil.intValueOrDefault(json, "bookId", 0),
                valueOrDefault(JsonUtil.stringValue(json, "bookTitle"), "-"),
                valueOrDefault(JsonUtil.stringValue(json, "bookJenis"), "-"),
                valueOrDefault(JsonUtil.stringValue(json, "borrowDate"), "-"),
                JsonUtil.intValueOrDefault(json, "borrowDays", 0),
                valueOrDefault(JsonUtil.stringValue(json, "dueDate"), "-"),
                valueOrDefault(JsonUtil.stringValue(json, "returnDate"), "-"),
                JsonUtil.floatValueOrDefault(json, "fine", 0F),
                JsonUtil.booleanValueOrDefault(json, "returned", false)
        );
    }

    private String valueOrDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private float hitungDenda(BorrowedBook borrowedBook, LocalDate tanggalKembali) {
        if (!"fiksi".equalsIgnoreCase(borrowedBook.getBookJenis())) {
            return 0F;
        }

        LocalDate tanggalPengembalian = LocalDate.parse(borrowedBook.getDueDate(), DATE_FORMATTER);
        long terlambatHari = java.time.temporal.ChronoUnit.DAYS.between(tanggalPengembalian, tanggalKembali);
        if (terlambatHari <= 0) {
            return 0F;
        }

        return terlambatHari * DENDA_FIKSI_PER_HARI;
    }
}
