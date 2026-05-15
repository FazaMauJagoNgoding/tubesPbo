package com.perpustakaan.auth;

public class AuthSession {
    private final String uid;
    private final String email;
    private final String idToken;
    private final String role;
    private final String name;

    public AuthSession(String uid, String email, String idToken, String role) {
        this(uid, email, idToken, role, email);
    }

    public AuthSession(String uid, String email, String idToken, String role, String name) {
        this.uid = uid;
        this.email = email;
        this.idToken = idToken;
        this.role = role;
        this.name = name;
    }

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }

    public String getUid() {
        return uid;
    }

    public String getEmail() {
        return email;
    }

    public String getIdToken() {
        return idToken;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }
}
