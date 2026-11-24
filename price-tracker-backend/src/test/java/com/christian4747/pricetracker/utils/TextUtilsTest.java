package com.christian4747.pricetracker.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

public class TextUtilsTest {

    @Test
    public void stripToNull_paddedValue_returnStripped() {
        assertEquals("Corner shop", TextUtils.stripToNull("  Corner shop "));
    }

    /**
     * Only the ends are stripped, so spaces between words are kept as typed.
     */
    @Test
    public void stripToNull_innerSpaces_keepInnerSpaces() {
        assertEquals("Corner  shop", TextUtils.stripToNull(" Corner  shop "));
    }

    /**
     * Full-width spaces (U+3000) count as spaces, the same as for isBlank(), so a value padded with them is stripped.
     */
    @Test
    public void stripToNull_fullWidthSpaces_returnStripped() {
        assertEquals("Corner shop", TextUtils.stripToNull("　Corner shop　"));
    }

    @Test
    public void stripToNull_blankValue_returnNull() {
        assertNull(TextUtils.stripToNull(" 　 "));
    }

    @Test
    public void stripToNull_null_returnNull() {
        assertNull(TextUtils.stripToNull(null));
    }

    @Test
    public void nullSafeStrip_paddedValue_returnStripped() {
        assertEquals("USD", TextUtils.nullSafeStrip(" USD  "));
    }

    /**
     * Full-width spaces count as spaces here too.
     */
    @Test
    public void nullSafeStrip_fullWidthSpaces_returnStripped() {
        assertEquals("USD", TextUtils.nullSafeStrip("　USD　"));
    }

    /**
     * Unlike stripToNull, a blank value becomes an empty string rather than null, for fields that save blanks as empty
     * strings.
     */
    @Test
    public void nullSafeStrip_blankValue_returnEmptyString() {
        assertEquals("", TextUtils.nullSafeStrip("   "));
    }

    @Test
    public void nullSafeStrip_null_returnNull() {
        assertNull(TextUtils.nullSafeStrip(null));
    }
}
