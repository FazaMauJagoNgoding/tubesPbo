package com.perpustakaan.model;

public class Book {
    private final int id;
    private final String judul;
    private final String jenis;
    private int stock;

    public Book(int id, String judul, String jenis, int stock) {
        if (stock < 0) {
            throw new IllegalArgumentException("Stock buku tidak boleh negatif.");
        }

        this.id = id;
        this.judul = judul;
        this.jenis = jenis;
        this.stock = stock;
    }

    public String getInfo() {
        return String.format(
                "ID: %d | Judul: %s | Jenis: %s | Stock: %d",
                id,
                judul,
                jenis,
                stock
        );
    }

    public void kurangiStock() {
        if (stock <= 0) {
            throw new IllegalStateException("Stock buku habis.");
        }

        stock--;
    }

    public int getId() {
        return id;
    }

    public String getJudul() {
        return judul;
    }

    public String getJenis() {
        return jenis;
    }

    public int getStock() {
        return stock;
    }
}
