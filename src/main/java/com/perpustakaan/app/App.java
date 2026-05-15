package com.perpustakaan.app;

import com.perpustakaan.auth.AuthService;
import com.perpustakaan.auth.AuthSession;
import com.perpustakaan.config.FirebaseConfig;
import com.perpustakaan.firebase.FirebaseClient;
import com.perpustakaan.model.Book;
import com.perpustakaan.model.Loan;
import com.perpustakaan.service.FirebaseLibraryService;

import java.util.Scanner;

public class App {
    private final Scanner scanner;
    private final AuthService authService;
    private final FirebaseLibraryService libraryService;

    public App() {
        this.scanner = new Scanner(System.in);
        FirebaseClient firebaseClient = new FirebaseClient(new FirebaseConfig());
        this.authService = new AuthService(firebaseClient);
        this.libraryService = new FirebaseLibraryService(firebaseClient);
    }

    public void menuAdmin(AuthSession session) {
        int pilihan;

        do {
            System.out.println("\n=== Menu Admin ===");
            System.out.println("1. Tambah Buku");
            System.out.println("2. Lihat Buku");
            System.out.println("3. Kurangi Stock Buku");
            System.out.println("4. Hapus Buku");
            System.out.println("5. Lihat Buku Dipinjam");
            System.out.println("0. Logout");
            System.out.print("Pilih menu: ");

            pilihan = bacaAngka();

            switch (pilihan) {
                case 1 -> tambahBukuDariInput(session);
                case 2 -> libraryService.tampilkanDaftarBuku(session);
                case 3 -> kurangiStockBukuDariInput(session);
                case 4 -> hapusBukuDariInput(session);
                case 5 -> libraryService.tampilkanDaftarPeminjaman(session);
                case 0 -> System.out.println("Logout berhasil.");
                default -> System.out.println("Menu tidak valid.");
            }
        } while (pilihan != 0);
    }

    public void menuMember(AuthSession session) {
        int pilihan;

        do {
            System.out.println("\n=== Menu Member ===");
            System.out.println("1. Lihat Buku");
            System.out.println("2. Pinjam Buku");
            System.out.println("3. Lihat Peminjaman Saya");
            System.out.println("4. Kembalikan Buku");
            System.out.println("0. Logout");
            System.out.print("Pilih menu: ");

            pilihan = bacaAngka();

            switch (pilihan) {
                case 1 -> libraryService.tampilkanDaftarBuku(session);
                case 2 -> pinjamBukuDariInput(session);
                case 3 -> libraryService.tampilkanPeminjamanMember(session);
                case 4 -> kembalikanBukuDariInput(session);
                case 0 -> System.out.println("Logout berhasil.");
                default -> System.out.println("Menu tidak valid.");
            }
        } while (pilihan != 0);
    }

    public void run() {
        int pilihan;

        do {
            System.out.println("\n=== Aplikasi Perpustakaan ===");
            System.out.println("1. Login");
            System.out.println("2. Daftar Member");
            System.out.println("0. Keluar");
            System.out.print("Pilih menu: ");

            pilihan = bacaAngka();

            switch (pilihan) {
                case 1 -> login();
                case 2 -> daftarMember();
                case 0 -> System.out.println("Aplikasi ditutup.");
                default -> System.out.println("Menu tidak valid.");
            }
        } while (pilihan != 0);
    }

    private void login() {
        System.out.print("Email: ");
        String email = scanner.nextLine();
        System.out.print("Password: ");
        String password = scanner.nextLine();

        try {
            AuthSession session = authService.login(email, password);
            if (session.isAdmin()) {
                menuAdmin(session);
            } else {
                menuMember(session);
            }
        } catch (IllegalStateException exception) {
            System.out.println("Login gagal. Periksa email, password, atau koneksi Firebase.");
        }
    }

    private void daftarMember() {
        System.out.print("Nama: ");
        String name = scanner.nextLine();
        System.out.print("Email: ");
        String email = scanner.nextLine();
        System.out.print("Password: ");
        String password = scanner.nextLine();

        try {
            authService.registerMember(name, email, password);
            System.out.println("Registrasi member berhasil. Silakan login.");
        } catch (IllegalStateException exception) {
            System.out.println("Registrasi gagal. Periksa data atau konfigurasi Firebase.");
        }
    }

    private void tambahBukuDariInput(AuthSession session) {
        System.out.print("ID buku: ");
        int id = bacaAngka();
        System.out.print("Judul: ");
        String judul = scanner.nextLine();
        System.out.print("Jenis: ");
        String jenis = scanner.nextLine();
        System.out.print("Stock: ");
        int stock = bacaAngka();

        try {
            libraryService.tambahBuku(session, new Book(id, judul, jenis, stock));
            System.out.println("Buku berhasil ditambahkan.");
        } catch (IllegalArgumentException | IllegalStateException exception) {
            System.out.println(exception.getMessage());
        }
    }

    private void kurangiStockBukuDariInput(AuthSession session) {
        System.out.print("ID buku yang stock-nya dikurangi: ");
        int idBuku = bacaAngka();

        try {
            libraryService.kurangiStockBuku(session, idBuku);
            System.out.println("Stock buku berhasil dikurangi.");
        } catch (IllegalArgumentException | IllegalStateException exception) {
            System.out.println(exception.getMessage());
        }
    }

    private void hapusBukuDariInput(AuthSession session) {
        System.out.print("ID buku yang dihapus: ");
        int idBuku = bacaAngka();

        try {
            libraryService.hapusBuku(session, idBuku);
            System.out.println("Buku berhasil dihapus.");
        } catch (IllegalArgumentException | IllegalStateException exception) {
            System.out.println(exception.getMessage());
        }
    }

    private void pinjamBukuDariInput(AuthSession session) {
        System.out.print("ID buku yang dipinjam: ");
        int idBuku = bacaAngka();
        System.out.print("Berapa hari dipinjam: ");
        int lamaHari = bacaAngka();

        try {
            Loan loan = libraryService.pinjamBuku(session, idBuku, lamaHari);
            System.out.printf("Total biaya pinjam: Rp%.0f%n", loan.getTotalHarga());
            System.out.print("Jumlah bayar: ");
            float jumlahBayar = bacaFloat();
            libraryService.prosesPembayaran(session, loan, jumlahBayar);
            System.out.println("Peminjaman berhasil diproses.");
            System.out.println("Tanggal pengembalian: " + loan.getDueDate());
        } catch (IllegalArgumentException | IllegalStateException exception) {
            System.out.println(exception.getMessage());
        }
    }

    private void kembalikanBukuDariInput(AuthSession session) {
        System.out.println("Daftar peminjaman kamu:");
        libraryService.tampilkanPeminjamanMember(session);
        System.out.print("Masukkan Loan ID yang dikembalikan: ");
        String loanId = scanner.nextLine();

        try {
            float denda = libraryService.kembalikanBuku(session, loanId);
            System.out.println("Buku berhasil dikembalikan.");
            if (denda > 0) {
                System.out.printf("Denda keterlambatan: Rp%.0f%n", denda);
            }
        } catch (IllegalArgumentException | IllegalStateException exception) {
            System.out.println(exception.getMessage());
        }
    }

    private int bacaAngka() {
        while (!scanner.hasNextInt()) {
            System.out.print("Input harus berupa angka. Masukkan lagi: ");
            scanner.next();
        }

        int value = scanner.nextInt();
        scanner.nextLine();
        return value;
    }

    private float bacaFloat() {
        while (!scanner.hasNextFloat()) {
            System.out.print("Input harus berupa angka. Masukkan lagi: ");
            scanner.next();
        }

        float value = scanner.nextFloat();
        scanner.nextLine();
        return value;
    }
}
