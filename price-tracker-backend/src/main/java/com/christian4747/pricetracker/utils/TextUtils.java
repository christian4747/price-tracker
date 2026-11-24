package com.christian4747.pricetracker.utils;

/**
 * Helpers for cleaning up text before it's saved. Spaces at either end of a value are invisible in the app, but they
 * still make two values count as different, so the services strip them before saving or looking a value up.
 * strip() is used rather than trim() so full-width spaces are removed too, the same spaces isBlank() ignores.
 */
public final class TextUtils {

    private TextUtils() {
    }

    /**
     * Strips spaces from both ends of a value, and converts a blank value to null. Null keeps an empty optional value,
     * such as a brand or a Period's store, together with the other empty values when sorting and matching.
     * @param value The value to strip
     * @return Null if the value is null or blank, otherwise the value without spaces at either end
     */
    public static String stripToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    /**
     * Strips spaces from both ends of a value, leaving null as null. Unlike stripToNull, a blank value becomes an
     * empty string, so fields that save blanks as empty strings keep doing so.
     * @param value The value to strip
     * @return Null if the value is null, otherwise the value without spaces at either end
     */
    public static String nullSafeStrip(String value) {
        return value == null ? null : value.strip();
    }
}
