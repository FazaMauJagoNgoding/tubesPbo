package com.perpustakaan.service;

import com.perpustakaan.model.Book;
import com.perpustakaan.model.Loan;
import com.perpustakaan.model.Member;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class LibraryService {
    private final List<Book> daftarBuku;
    private final List<Loan> daftarLoan;
    private int nextLoanId;

    public LibraryService() {
        this.daftarBuku = new ArrayList<>();
        this.daftarLoan = new ArrayList<>();
        this.nextLoanId = 1;
    }

    public void tambahBuku(Book book) {
        daftarBuku.add(book);
    }

    public void tampilkanDaftarBuku() {
        if (daftarBuku.isEmpty()) {
            System.out.println("Belum ada buku di perpustakaan.");
            return;
        }

        daftarBuku.forEach(book -> System.out.println(book.getInfo()));
    }

    public Loan pinjamBuku(Member member, int idBuku) {
        Book book = cariBukuById(idBuku)
                .orElseThrow(() -> new IllegalArgumentException("Buku tidak ditemukan."));

        book.kurangiStock();

        Loan loan = new Loan(nextLoanId++, member, book);
        daftarLoan.add(loan);
        return loan;
    }

    public List<Book> getDaftarBuku() {
        return Collections.unmodifiableList(daftarBuku);
    }

    public List<Loan> getDaftarLoan() {
        return Collections.unmodifiableList(daftarLoan);
    }

    private Optional<Book> cariBukuById(int idBuku) {
        return daftarBuku.stream()
                .filter(book -> book.getId() == idBuku)
                .findFirst();
    }
}
