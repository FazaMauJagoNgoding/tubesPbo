package com.perpustakaan.model;

public class Loan {
    private static final float BIAYA_PINJAM_BUKU = 2_000F;

    private final String idLoan;
    private final String memberUid;
    private final Member member;
    private final Book book;
    private final String dueDate;
    private float totalHarga;
    private boolean paid;

    public Loan(int idLoan, Member member, Book book) {
        this(String.valueOf(idLoan), null, member, book, BIAYA_PINJAM_BUKU, false, "-");
    }

    public Loan(String idLoan, String memberUid, Book book, float totalHarga, boolean paid) {
        this(idLoan, memberUid, null, book, totalHarga, paid, "-");
    }

    public Loan(String idLoan, String memberUid, Book book, float totalHarga, boolean paid, String dueDate) {
        this(idLoan, memberUid, null, book, totalHarga, paid, dueDate);
    }

    private Loan(String idLoan, String memberUid, Member member, Book book, float totalHarga, boolean paid, String dueDate) {
        this.idLoan = idLoan;
        this.memberUid = memberUid;
        this.member = member;
        this.book = book;
        this.dueDate = dueDate;
        this.totalHarga = totalHarga;
        this.paid = paid;
    }

    public float hitungBiaya() {
        return BIAYA_PINJAM_BUKU;
    }

    public void prosesPembayaran(float jumlahBayar) {
        if (jumlahBayar < totalHarga) {
            throw new IllegalArgumentException("Pembayaran kurang dari total biaya.");
        }

        paid = true;
    }

    public String getIdLoan() {
        return idLoan;
    }

    public String getMemberUid() {
        return memberUid;
    }

    public Member getMember() {
        return member;
    }

    public Book getBook() {
        return book;
    }

    public float getTotalHarga() {
        return totalHarga;
    }

    public boolean isPaid() {
        return paid;
    }

    public String getDueDate() {
        return dueDate;
    }
}
