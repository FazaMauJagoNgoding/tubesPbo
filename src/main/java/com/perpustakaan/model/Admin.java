package com.perpustakaan.model;

import com.perpustakaan.service.LibraryService;

public class Admin extends User {
    public Admin(int id, String name, String email, String password) {
        super(id, name, email, password);
    }

    public void tambahBuku(LibraryService libraryService, Book book) {
        libraryService.tambahBuku(book);
    }

    public void lihatBuku(LibraryService libraryService) {
        libraryService.tampilkanDaftarBuku();
    }
}
