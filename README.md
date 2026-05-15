# Aplikasi Perpustakaan Java + Firebase

Implementasi aplikasi perpustakaan sederhana berdasarkan class diagram, memakai Firebase Authentication dan Firebase Realtime Database lewat REST API.

## Struktur

- `User`: abstract class untuk data dan proses login/logout.
- `Admin`: turunan `User`, dapat menambah dan melihat buku.
- `Member`: turunan `User`, dapat melihat dan meminjam buku.
- `Book`: menyimpan data buku dan mengurangi stock.
- `Loan`: menyimpan transaksi peminjaman dan pembayaran.
- `AuthService`: login dan registrasi member melalui Firebase Authentication.
- `FirebaseLibraryService`: menyimpan buku dan peminjaman ke Firebase Realtime Database.
- `App`: menjalankan menu aplikasi.

## Setup Firebase

1. Buat project di Firebase Console.
2. Aktifkan Authentication dengan provider `Email/Password`.
3. Buat Realtime Database.
4. Salin rules dari `firebase-database.rules.json` ke Realtime Database Rules.
5. Buat akun admin di Firebase Authentication.
6. Ambil UID akun admin, lalu buat data berikut di Realtime Database:

```json
{
  "users": {
    "UID_ADMIN_DARI_FIREBASE_AUTH": {
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

Contoh data awal buku tersedia di `firebase-seed-example.json`.

## Environment Variable

PowerShell:

```powershell
$env:FIREBASE_API_KEY="web-api-key-firebase"
$env:FIREBASE_DATABASE_URL="https://project-id-default-rtdb.firebaseio.com"
```

Untuk region tertentu, URL database bisa berbentuk:

```powershell
$env:FIREBASE_DATABASE_URL="https://project-id-default-rtdb.asia-southeast1.firebasedatabase.app"
```

Frontend React membaca Firebase yang sama lewat Vite env. Buat file `ui/.env.local`:

```env
VITE_FIREBASE_API_KEY="web-api-key-firebase"
VITE_FIREBASE_DATABASE_URL="https://project-id-default-rtdb.firebaseio.com"
```

Jika env frontend belum diset, UI tetap berjalan dengan data demo. Jika sudah diset, halaman login memakai Firebase Authentication dan dashboard mengambil data dari Realtime Database path `users`, `books`, dan `loans` yang sama dengan aplikasi Java.

## Cara Menjalankan

Paling cepat:

```powershell
.\run.ps1
```

Jika PowerShell memblokir script, jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

Manual:

```powershell
javac -d out (Get-ChildItem -Recurse -Filter *.java src/main/java | ForEach-Object { $_.FullName })
java -cp out com.perpustakaan.Main
```

Frontend:

```powershell
cd ui
npm install
npm run dev
```
