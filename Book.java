public class Book {
    private int id;
    private String judul;
    private String jenis;
    private int stok;

    public Book(int id, String judul, String jenis, int stok) {
        this.id = id;
        this.judul = judul;
        this.jenis = jenis;
        this.stok = stok;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getJudul() {
        return judul;
    }

    public void setJudul(String judul) {
        this.judul = judul;
    }

    public String getJenis() {
        return jenis;
    }

    public void setJenis(String jenis) {
        this.jenis = jenis;
    }

    public int getStok() {
        return stok;
    }

    public void setStok(int stok) {
        this.stok = stok;
    }

    @Override
    public String toString() {
        return "ID: " + id + " | Judul: " + judul + " | Jenis: " + jenis + " | Stok: " + stok;
    }
}