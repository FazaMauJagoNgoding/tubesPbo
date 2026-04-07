public abstract class User {
    private int id;
    private String nama;
    private String email;
    private String password;

    public User(int id, String nama, String email, String password) {
        this.id = id;
        this.nama = nama;
        this.email = email;
        this.password = password;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNama() {
        return nama;
    }

    public void setNama(String nama) {
        this.nama = nama;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean login(String email, String password) {
        if (email == null || password == null) {
            return false;
        }
        return this.email.equals(email) && this.password.equals(password);
    }

    public void logout() {
        System.out.println(nama + " telah logout.");
    }
}