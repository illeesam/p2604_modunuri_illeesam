package com.shopjoy.ecadminapi.common.util;

import java.util.Map;

public class PatchUtil {

    private PatchUtil() {}

    /**
     * Apply non-null values from patch map to existing data map.
     * Used for PATCH operations where only provided fields should be updated.
     */
    public static Map<String, Object> applyPatch(Map<String, Object> existing, Map<String, Object> patch) {
        for (Map.Entry<String, Object> entry : patch.entrySet()) {
            if (entry.getValue() != null) {
                existing.put(entry.getKey(), entry.getValue());
            }
        }
        return existing;
    }
}
