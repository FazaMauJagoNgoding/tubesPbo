package com.perpustakaan.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class JsonUtil {
    private JsonUtil() {
    }

    public static String stringValue(String json, String key) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"")
                .matcher(json);

        if (!matcher.find()) {
            return null;
        }

        return unescape(matcher.group(1));
    }

    public static int intValue(String json, String key) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?\\d+)")
                .matcher(json);

        if (!matcher.find()) {
            throw new IllegalArgumentException("Field angka tidak ditemukan: " + key);
        }

        return Integer.parseInt(matcher.group(1));
    }

    public static int intValueOrDefault(String json, String key, int defaultValue) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?\\d+)")
                .matcher(json);

        if (!matcher.find()) {
            return defaultValue;
        }

        return Integer.parseInt(matcher.group(1));
    }

    public static float floatValue(String json, String key) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)")
                .matcher(json);

        if (!matcher.find()) {
            throw new IllegalArgumentException("Field angka tidak ditemukan: " + key);
        }

        return Float.parseFloat(matcher.group(1));
    }

    public static float floatValueOrDefault(String json, String key, float defaultValue) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)")
                .matcher(json);

        if (!matcher.find()) {
            return defaultValue;
        }

        return Float.parseFloat(matcher.group(1));
    }

    public static boolean booleanValue(String json, String key) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(true|false)")
                .matcher(json);

        if (!matcher.find()) {
            throw new IllegalArgumentException("Field boolean tidak ditemukan: " + key);
        }

        return Boolean.parseBoolean(matcher.group(1));
    }

    public static boolean booleanValueOrDefault(String json, String key, boolean defaultValue) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(true|false)")
                .matcher(json);

        if (!matcher.find()) {
            return defaultValue;
        }

        return Boolean.parseBoolean(matcher.group(1));
    }

    public static String quote(String value) {
        return "\"" + escape(value) + "\"";
    }

    public static String escape(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String unescape(String value) {
        return value
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }
}
