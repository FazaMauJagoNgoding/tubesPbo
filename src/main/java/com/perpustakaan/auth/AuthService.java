package com.perpustakaan.auth;

import com.perpustakaan.firebase.FirebaseClient;
import com.perpustakaan.util.JsonUtil;

public class AuthService {
    private final FirebaseClient firebaseClient;

    public AuthService(FirebaseClient firebaseClient) {
        this.firebaseClient = firebaseClient;
    }

    public AuthSession login(String email, String password) {
        String body = "{"
                + "\"email\":" + JsonUtil.quote(email) + ","
                + "\"password\":" + JsonUtil.quote(password) + ","
                + "\"returnSecureToken\":true"
                + "}";

        String response = firebaseClient.postAuth("signInWithPassword", body);
        String idToken = JsonUtil.stringValue(response, "idToken");
        String uid = JsonUtil.stringValue(response, "localId");
        String responseEmail = JsonUtil.stringValue(response, "email");
        String userJson = getUserJson(uid, idToken);
        String role = getUserRole(userJson);
        String name = getUserName(userJson, responseEmail);

        return new AuthSession(uid, responseEmail, idToken, role, name);
    }

    public AuthSession registerMember(String name, String email, String password) {
        String body = "{"
                + "\"email\":" + JsonUtil.quote(email) + ","
                + "\"password\":" + JsonUtil.quote(password) + ","
                + "\"returnSecureToken\":true"
                + "}";

        String response = firebaseClient.postAuth("signUp", body);
        String idToken = JsonUtil.stringValue(response, "idToken");
        String uid = JsonUtil.stringValue(response, "localId");
        String responseEmail = JsonUtil.stringValue(response, "email");

        String userJson = "{"
                + "\"name\":" + JsonUtil.quote(name) + ","
                + "\"email\":" + JsonUtil.quote(responseEmail) + ","
                + "\"role\":\"member\""
                + "}";
        firebaseClient.putDatabase("users/" + uid, idToken, userJson);

        return new AuthSession(uid, responseEmail, idToken, "member", name);
    }

    private String getUserJson(String uid, String idToken) {
        return firebaseClient.getDatabase("users/" + uid, idToken);
    }

    private String getUserRole(String userJson) {
        if (userJson == null || userJson.equals("null")) {
            return "member";
        }

        String role = JsonUtil.stringValue(userJson, "role");
        return role == null ? "member" : role;
    }

    private String getUserName(String userJson, String email) {
        if (userJson == null || userJson.equals("null")) {
            return email;
        }

        String name = JsonUtil.stringValue(userJson, "name");
        return name == null || name.isBlank() ? email : name;
    }
}
