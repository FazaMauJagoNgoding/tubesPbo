package com.perpustakaan.firebase;

import com.perpustakaan.config.FirebaseConfig;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class FirebaseClient {
    private final FirebaseConfig config;
    private final HttpClient httpClient;

    public FirebaseClient(FirebaseConfig config) {
        this.config = config;
        this.httpClient = HttpClient.newHttpClient();
    }

    public String postAuth(String endpoint, String jsonBody) {
        String url = "https://identitytoolkit.googleapis.com/v1/accounts:"
                + endpoint
                + "?key="
                + encode(config.getApiKey());
        return send("POST", url, jsonBody);
    }

    public String getDatabase(String path, String idToken) {
        return send("GET", databaseUrl(path, idToken), null);
    }

    public String putDatabase(String path, String idToken, String jsonBody) {
        return send("PUT", databaseUrl(path, idToken), jsonBody);
    }

    public String postDatabase(String path, String idToken, String jsonBody) {
        return send("POST", databaseUrl(path, idToken), jsonBody);
    }

    public String deleteDatabase(String path, String idToken) {
        return send("DELETE", databaseUrl(path, idToken), null);
    }

    private String databaseUrl(String path, String idToken) {
        String normalizedPath = path.startsWith("/") ? path.substring(1) : path;
        return config.getDatabaseUrl()
                + "/"
                + normalizedPath
                + ".json?auth="
                + encode(idToken);
    }

    private String send(String method, String url, String jsonBody) {
        try {
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json");

            if ("GET".equals(method)) {
                requestBuilder.GET();
            } else if ("DELETE".equals(method)) {
                requestBuilder.DELETE();
            } else {
                requestBuilder.method(method, HttpRequest.BodyPublishers.ofString(jsonBody));
            }

            HttpResponse<String> response = httpClient.send(
                    requestBuilder.build(),
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Firebase error: " + response.body());
            }

            return response.body();
        } catch (IOException exception) {
            throw new IllegalStateException("Gagal terhubung ke Firebase.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Request ke Firebase dibatalkan.", exception);
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
