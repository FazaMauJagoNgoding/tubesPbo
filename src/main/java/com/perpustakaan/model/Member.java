package com.perpustakaan.model;

import com.perpustakaan.service.LibraryService;

public class Member extends User {
    public Member(int id, String name, String email, String password) {
        super(id, name, email, password);
    }

    public void lihatBuku(LibraryService libraryService) {
        libraryService.tampilkanDaftarBuku();
    }

    public Loan pinjamBuku(LibraryService libraryService, int idBuku) {
        return libraryService.pinjamBuku(this, idBuku);
    }
}
