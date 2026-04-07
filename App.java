import java.util.ArrayList;
import java.util.Scanner;

public class App {
    private static ArrayList<Book> books = new ArrayList<>();
    private static Admin admin = new Admin(1, "Admin Utama", "admin", "admin123");
    private static Member member = new Member(2, "Budi", "budi", "member123");

    public static void main(String[] args) {
        // Inisialisasi data buku awal
        books.add(new Book(1, "Harry Potter", "Fiksi", 5));
        books.add(new Book(2, "Sejarah Indonesia", "NonFiksi", 3));
        books.add(new Book(3, "Lord of the Rings", "Fiksi", 2));
        books.add(new Book(4, "Matematika Dasar", "NonFiksi", 4));

        Scanner scanner = new Scanner(System.in);

        while (true) {
            User currentUser = login(scanner);
            if (currentUser == null) {
                break; // keluar program
            }

            if (currentUser instanceof Admin) {
                menuAdmin(scanner);
            } else if (currentUser instanceof Member) {
                menuMember(scanner);
            }
        }
    }

    private static User login(Scanner scanner) {
        while (true) {
            System.out.println("=== Sistem Perpustakaan ===");
            System.out.println("1. Login");
            System.out.println("2. Keluar");
            System.out.print("Pilihan: ");
            int pilihan = scanner.nextInt();
            scanner.nextLine(); // consume newline

            if (pilihan == 2) {
                System.out.println("Program selesai.");
                return null; // signal to exit
            } else if (pilihan == 1) {
                System.out.println("Masukkan email dan password");
                System.out.print("Email: ");
                String email = scanner.nextLine().trim();
                System.out.print("Password: ");
                String password = scanner.nextLine().trim();

                if (admin.login(email, password)) {
                    System.out.println("Login berhasil sebagai Admin: " + admin.getNama());
                    return admin;
                } else if (member.login(email, password)) {
                    System.out.println("Login berhasil sebagai Member: " + member.getNama());
                    return member;
                } else {
                    System.out.println("Login gagal. Email atau password salah.");
                    // continue loop for retry
                }
            } else {
                System.out.println("Pilihan tidak valid.");
            }
        }
    }

    private static void menuAdmin(Scanner scanner) {
        while (true) {
            System.out.println("\n=== Menu Admin ===");
            System.out.println("1. Lihat daftar buku");
            System.out.println("2. Tambah buku");
            System.out.println("3. Logout");
            System.out.print("Pilihan: ");
            int pilihan = scanner.nextInt();
            scanner.nextLine(); // consume newline

            switch (pilihan) {
                case 1:
                    admin.lihatBuku(books);
                    break;
                case 2:
                    admin.tambahBuku(books, scanner);
                    break;
                case 3:
                    admin.logout();
                    return; // kembali ke login
                default:
                    System.out.println("Pilihan tidak valid.");
            }
        }
    }

    private static void menuMember(Scanner scanner) {
        while (true) {
            System.out.println("\n=== Menu Member ===");
            System.out.println("1. Lihat buku");
            System.out.println("2. Pinjam buku");
            System.out.println("3. Logout");
            System.out.print("Pilihan: ");
            int pilihan = scanner.nextInt();
            scanner.nextLine(); // consume newline

            switch (pilihan) {
                case 1:
                    member.lihatBuku(books);
                    break;
                case 2:
                    member.pinjamBuku(books, scanner);
                    break;
                case 3:
                    member.logout();
                    return; // kembali ke login
                default:
                    System.out.println("Pilihan tidak valid.");
            }
        }
    }
}