import java.util.ArrayList;
import java.util.Scanner;

public class Admin extends User {
    public Admin(int id, String nama, String email, String password) {
        super(id, nama, email, password);
    }

    public void tambahBuku(ArrayList<Book> books, Scanner scanner) {
        System.out.print("Masukkan judul buku: ");
        String judul = scanner.nextLine().trim();
        System.out.println("Pilih jenis buku:");
        System.out.println("1. Fiksi");
        System.out.println("2. NonFiksi");
        System.out.print("Pilihan: ");
        int pilihanJenis = scanner.nextInt();
        scanner.nextLine(); // consume newline
        String jenis = pilihanJenis == 1 ? "Fiksi" : "NonFiksi";
        System.out.print("Masukkan stok: ");
        int stok = scanner.nextInt();
        scanner.nextLine(); // consume newline
        int id = books.size() + 1;
        Book newBook = new Book(id, judul, jenis, stok);
        books.add(newBook);
        System.out.println("Buku berhasil ditambahkan: " + newBook);
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
}