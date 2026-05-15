package com.perpustakaan.config;

public class FirebaseConfig {
    private final String apiKey;
    private final String databaseUrl;

    public FirebaseConfig() {
        this.apiKey = readRequiredEnv("FIREBASE_API_KEY");
        this.databaseUrl = removeTrailingSlash(readRequiredEnv("FIREBASE_DATABASE_URL"));
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getDatabaseUrl() {
        return databaseUrl;
    }

    private String readRequiredEnv(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Environment variable " + key + " belum diatur.");
        }

        return value;
    }

    private String removeTrailingSlash(String value) {
        String sanitizedValue = value.replaceAll("\\s+", "");
        if (sanitizedValue.endsWith("/")) {
            return sanitizedValue.substring(0, sanitizedValue.length() - 1);
        }

        return sanitizedValue;
    }
}
