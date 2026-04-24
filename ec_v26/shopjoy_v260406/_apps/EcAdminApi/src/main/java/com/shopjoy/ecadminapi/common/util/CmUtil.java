package com.shopjoy.ecadminapi.common.util;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 공통 유틸리티.
 */
public class CmUtil {

    private CmUtil() {}

    /** @deprecated PageHelper.addPaging(p) 사용 */
    @Deprecated
    public static void addPaging(Map<String, Object> p) {
        PageHelper.addPaging(p);
    }

    /**
     * null·빈 값을 무시하며 Map 생성.
     * 사용: CmUtil.params("siteId", siteId, "kw", kw, ...)
     */
    public static Map<String, Object> params(Object... keyValues) {
        Map<String, Object> p = new HashMap<>();
        for (int i = 0; i < keyValues.length - 1; i += 2) {
            String key = String.valueOf(keyValues[i]);
            Object val = keyValues[i + 1];
            if (val instanceof String s) {
                if (s != null && !s.isBlank()) p.put(key, s);
            } else if (val != null) {
                p.put(key, val);
            }
        }
        return p;
    }

    /**
     * 필수 파라미터 존재 여부 검증. 없으면 CmBizException(400).
     * 사용: CmUtil.require(p, "siteId", "kw")
     */
    public static void require(Map<String, Object> p, String... keys) {
        for (String key : keys) {
            Object val = p.get(key);
            if (val == null || val.toString().isBlank()) {
                throw new CmBizException("필수 파라미터 누락: " + key);
            }
        }
    }

    /**
     * '^' 구분자로 이름 파싱 (예: "auth^user^role" → ["auth", "user", "role"])
     */
    public static List<String> parseNames(String names) {
        List<String> items = new ArrayList<>();
        if (names == null || names.trim().isEmpty()) {
            return items;
        }
        String[] parts = names.split("\\^");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                items.add(trimmed);
            }
        }
        return items;
    }

    /**
     * null·빈 값을 기본값으로 치환. null이거나 empty면 defaultValue 반환.
     * 사용: CmUtil.nvl(value, ""), CmUtil.nvl(value)
     */
    public static String nvl(String value, String defaultValue) {
        return (value == null || value.isEmpty()) ? defaultValue : value;
    }

    public static String nvl(String value) {
        return nvl(value, "");
    }

    /**
     * List null 체크. null이면 defaultValue 반환.
     * 사용: CmUtil.nvlList(value, List.of()), CmUtil.nvlList(value)
     */
    public static <T> List<T> nvlList(List<T> value, List<T> defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    public static <T> List<T> nvlList(List<T> value) {
        return nvlList(value, new ArrayList<>());
    }

    /**
     * int null 체크. null이면 defaultValue 반환.
     * 사용: CmUtil.nvlInt(value, 0), CmUtil.nvlInt(value)
     */
    public static Integer nvlInt(Integer value, Integer defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    public static Integer nvlInt(Integer value) {
        return nvlInt(value, 0);
    }

    /**
     * long null 체크. null이면 defaultValue 반환.
     * 사용: CmUtil.nvlLong(value, 0L), CmUtil.nvlLong(value)
     */
    public static Long nvlLong(Long value, Long defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    public static Long nvlLong(Long value) {
        return nvlLong(value, 0L);
    }

    /**
     * boolean null 체크. null이면 defaultValue 반환.
     * 사용: CmUtil.nvlBool(value, false), CmUtil.nvlBool(value)
     */
    public static Boolean nvlBool(Boolean value, Boolean defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    public static Boolean nvlBool(Boolean value) {
        return nvlBool(value, false);
    }

    /**
     * Map null 체크. null이면 defaultValue 반환.
     * 사용: CmUtil.nvlMap(value, new HashMap<>()), CmUtil.nvlMap(value)
     */
    public static <K, V> Map<K, V> nvlMap(Map<K, V> value, Map<K, V> defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    public static <K, V> Map<K, V> nvlMap(Map<K, V> value) {
        return nvlMap(value, new HashMap<>());
    }

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** 
     * 테이블명 기반 ID 생성: prefix + yyMMddHHmmss(12) + rand4(4) 최대 21자
     * prefix _ 을 split 후 1번인덱스 2글자, 3~5번 인덱스 1글자씩 조합 최대 5글자 대문자
     * 예: "syh_user_login_hist" → "USLH" + "240610153045" + "1234" → "USLH2406101530451234"
     */
    public static String generateId(String tableNm) {
        String prefix = extractPrefix(tableNm);
        if (prefix == null || prefix.isBlank()) prefix = "XX";
        if (prefix.length() > 5) prefix = prefix.substring(0, 5);
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return prefix + ts + rand;
    }

    // 0번 인덱스(도메인) 제외, 1번=첫2자, 2~4번=첫1자, 최대5자 대문자
    private static String extractPrefix(String tableNm) {
        if (tableNm == null || tableNm.isBlank()) return "XX";
        String[] parts = tableNm.toUpperCase().split("_");
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i < parts.length && sb.length() < 5; i++) {
            if (parts[i].isEmpty()) continue;
            sb.append(i == 1 ? parts[i].substring(0, Math.min(2, parts[i].length()))
                             : parts[i].substring(0, 1));
        }
        return sb.toString();
    }

}
