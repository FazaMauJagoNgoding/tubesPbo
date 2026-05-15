package com.perpustakaan.model;

public abstract class User {
    private final int id;
    private final String name;
    private final String email;
    private final String password;
    private boolean loggedIn;

    protected User(int id, String name, String email, String password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.loggedIn = false;
    }

    public boolean login(String email, String password) {
        loggedIn = this.email.equals(email) && this.password.equals(password);
        return loggedIn;
    }

    public void logout() {
        loggedIn = false;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public boolean isLoggedIn() {
        return loggedIn;
    }
}
