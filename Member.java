import java.util.ArrayList;
import java.util.Random;
import java.util.Scanner;

public class Member extends User {
    public Member(int id, String nama, String email, String password) {
        super(id, nama, email, password);
    }

    public void lihatBuku(ArrayList<Book> books) {
        if (books.isEmpty()) {
            System.out.println("Tidak ada buku tersedia.");
        } else {
            System.out.println("Daftar Buku:");
            for (Book book : books) {
                System.out.println(book);
            }
        }
    }

    public void pinjamBuku(ArrayList<Book> books, Scanner scanner) {
        System.out.println("Pilih jenis buku:");
        System.out.println("1. Fiksi");
        System.out.println("2. NonFiksi");
        System.out.print("Pilihan: ");
        int pilihanJenis = scanner.nextInt();
        scanner.nextLine(); // consume newline
        String jenis = pilihanJenis == 1 ? "Fiksi" : "NonFiksi";

        ArrayList<Book> filteredBooks = new ArrayList<>();
        for (Book book : books) {
            if (book.getJenis().equals(jenis)) {
                filteredBooks.add(book);
            }
        }

        if (filteredBooks.isEmpty()) {
            System.out.println("Tidak ada buku jenis " + jenis + " tersedia.");
            return;
        }

        System.out.println("Buku jenis " + jenis + ":");
        for (int i = 0; i < filteredBooks.size(); i++) {
            System.out.println((i + 1) + ". " + filteredBooks.get(i));
        }

        System.out.print("Pilih nomor buku: ");
        int pilihanBuku = scanner.nextInt();
        scanner.nextLine(); // consume newline
        if (pilihanBuku < 1 || pilihanBuku > filteredBooks.size()) {
            System.out.println("Pilihan tidak valid.");
            return;
        }

        Book selectedBook = filteredBooks.get(pilihanBuku - 1);
        System.out.print("Masukkan jumlah hari pinjam: ");
        int hari = scanner.nextInt();
        scanner.nextLine(); // consume newline

        Random random = new Random();
        int hargaPerHari = 5000 + random.nextInt(15001); // 5000-20000
        int biayaTambahan = 2000 + random.nextInt(8001); // 2000-10000
        int total = (hargaPerHari * hari) + biayaTambahan;

        System.out.println("Detail Peminjaman:");
        System.out.println("Jenis Buku: " + jenis);
        System.out.println("Judul Buku: " + selectedBook.getJudul());
        System.out.println("Harga per Hari: Rp" + hargaPerHari);
        System.out.println("Jumlah Hari: " + hari);
        System.out.println("Biaya Tambahan: Rp" + biayaTambahan);
        System.out.println("Total Bayar: Rp" + total);

        while (true) {
            System.out.print("Masukkan uang: Rp");
            int uang = scanner.nextInt();
            scanner.nextLine(); // consume newline
            if (uang < total) {
                System.out.println("Uang tidak cukup. Total yang dibutuhkan: Rp" + total);
            } else {
                int kembalian = uang - total;
                System.out.println("Pembayaran berhasil!");
                System.out.println("Kembalian: Rp" + kembalian);
                break;
            }
        }
    }
}