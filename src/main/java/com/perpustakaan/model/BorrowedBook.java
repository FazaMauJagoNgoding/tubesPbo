package com.perpustakaan.model;

public class BorrowedBook {
    private final String loanId;
    private final String memberUid;
    private final String memberName;
    private final int bookId;
    private final String bookTitle;
    private final String bookJenis;
    private final String borrowDate;
    private final int borrowDays;
    private final String dueDate;
    private final String returnDate;
    private final float fine;
    private final boolean returned;

    public BorrowedBook(
            String loanId,
            String memberUid,
            String memberName,
            int bookId,
            String bookTitle,
            String bookJenis,
            String borrowDate,
            int borrowDays,
            String dueDate,
            String returnDate,
            float fine,
            boolean returned
    ) {
        this.loanId = loanId;
        this.memberUid = memberUid;
        this.memberName = memberName;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookJenis = bookJenis;
        this.borrowDate = borrowDate;
        this.borrowDays = borrowDays;
        this.dueDate = dueDate;
        this.returnDate = returnDate;
        this.fine = fine;
        this.returned = returned;
    }

    public String getLoanId() {
        return loanId;
    }

    public String getMemberUid() {
        return memberUid;
    }

    public String getMemberName() {
        return memberName;
    }

    public int getBookId() {
        return bookId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public String getBookJenis() {
        return bookJenis;
    }

    public String getBorrowDate() {
        return borrowDate;
    }

    public int getBorrowDays() {
        return borrowDays;
    }

    public String getDueDate() {
        return dueDate;
    }

    public boolean isReturned() {
        return returned;
    }

    public String getReturnDate() {
        return returnDate;
    }

    public float getFine() {
        return fine;
    }

    public String getInfo() {
        String status = returned ? "Dikembalikan" : "Dipinjam";
        return String.format(
                "Loan ID: %s | Member: %s | ID Buku: %d | Judul: %s | Jenis: %s | Tgl Pinjam: %s | Lama: %d hari | Tgl Pengembalian: %s | Tgl Kembali: %s | Denda: Rp%.0f | Status: %s",
                loanId,
                memberName,
                bookId,
                bookTitle,
                bookJenis,
                borrowDate,
                borrowDays,
                dueDate,
                returnDate,
                fine,
                status
        );
    }
}
