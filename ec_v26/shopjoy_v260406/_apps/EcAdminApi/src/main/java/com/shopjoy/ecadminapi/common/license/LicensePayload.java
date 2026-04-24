package com.shopjoy.ecadminapi.common.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 라이선스 코드 payload.
 * JSON 직렬화/역직렬화는 직접 처리 (외부 라이브러리 없이).
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicensePayload {

    private String siteType;    // "BO" | "FO"
    private String siteId;      // 사이트 ID
    private String siteNo;      // 사이트 번호
    private String buyerId;     // 구매자 ID
    private String expireDate;  // 만료일 (YYYY-MM-DD)

    /* ── 간단한 JSON 직렬화 (Jackson 없이) ──────────────────── */
    public String toJson() {
        return "{"
            + "\"siteType\":\"" + esc(siteType)   + "\","
            + "\"siteId\":\""   + esc(siteId)     + "\","
            + "\"siteNo\":\""   + esc(siteNo)     + "\","
            + "\"buyerId\":\""  + esc(buyerId)    + "\","
            + "\"expireDate\":\"" + esc(expireDate) + "\""
            + "}";
    }

    /* ── 간단한 JSON 역직렬화 ────────────────────────────────── */
    public static LicensePayload fromJson(String json) {
        return LicensePayload.builder()
            .siteType(  extract(json, "siteType"))
            .siteId(    extract(json, "siteId"))
            .siteNo(    extract(json, "siteNo"))
            .buyerId(   extract(json, "buyerId"))
            .expireDate(extract(json, "expireDate"))
            .build();
    }

    private static String extract(String json, String key) {
        String token = "\"" + key + "\":\"";
        int s = json.indexOf(token);
        if (s < 0) return "";
        s += token.length();
        int e = json.indexOf("\"", s);
        return e < 0 ? "" : json.substring(s, e);
    }

    private static String esc(String v) {
        return v == null ? "" : v.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
