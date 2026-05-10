package com.shopjoy.ecadminapi.common.license;

import com.shopjoy.ecadminapi.common.license.exception.LicenseException;
import com.shopjoy.ecadminapi.common.license.exception.LicenseException.Reason;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HexFormat;

/**
 * 라이선스 코드 생성 / 검증 유틸.
 *
 * 코드 구조:
 *   licenseCode = Base64(JSON payload) + '.' + HMAC-SHA256(앞 16자)
 *   payload     = { siteType, siteId, siteNo, buyerId, expireDate }
 *
 * 검증:
 *   1) 서명 일치 여부
 *   2) buyerId 일치 여부
 *   3) 만료일 (expireDate >= today)
 */
@Slf4j
public final class LicenseUtil {

    private LicenseUtil() {}

    /* ── HMAC-SHA256 앞 16자 서명 ─────────────────────────────── */
    static String sign(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw).substring(0, 16);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC 서명 실패", e);
        }
    }

    /* ── 코드 생성 ────────────────────────────────────────────── */
    public static String generateCode(String secret, LicensePayload payload) {
        String json  = payload.toJson();
        String b64   = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        String sig   = sign(secret, b64);
        return b64 + "." + sig;
    }

    /* ── 코드 검증 (LicenseException 발생) ───────────────────── */
    public static LicensePayload verify(String secret, String code, String expectedBuyerId) {
        if (code == null || code.isBlank()) {
            throw new LicenseException(Reason.NO_HEADER, "라이선스 코드가 없습니다.");
        }

        String[] parts = code.split("\\.", 2);
        if (parts.length != 2) {
            throw new LicenseException(Reason.INVALID_FORMAT, "라이선스 코드 형식이 올바르지 않습니다.");
        }

        String b64 = parts[0];
        String sig = parts[1];

        /* 서명 검증 */
        if (!sign(secret, b64).equals(sig)) {
            throw new LicenseException(Reason.INVALID_SIGNATURE, "라이선스 서명이 올바르지 않습니다.");
        }

        /* payload 파싱 */
        LicensePayload payload;
        try {
            String json = new String(Base64.getDecoder().decode(b64), StandardCharsets.UTF_8);
            payload = LicensePayload.fromJson(json);
        } catch (Exception e) {
            throw new LicenseException(Reason.INVALID_FORMAT, "라이선스 payload 파싱 실패: " + e.getMessage());
        }

        /* buyerId 검증 */
        if (expectedBuyerId != null && !expectedBuyerId.isBlank()
                && !expectedBuyerId.equals(payload.getBuyerId())) {
            throw new LicenseException(Reason.SITE_MISMATCH,
                "buyerId 불일치: expected=" + expectedBuyerId + ", actual=" + payload.getBuyerId());
        }

        /* 만료일 검증 */
        try {
            LocalDate expire = LocalDate.parse(payload.getExpireDate());
            if (LocalDate.now().isAfter(expire)) {
                throw new LicenseException(Reason.EXPIRED,
                    "라이선스가 만료되었습니다. (만료일: " + payload.getExpireDate() + ")");
            }
        } catch (LicenseException e) {
            throw e;
        } catch (Exception e) {
            throw new LicenseException(Reason.INVALID_FORMAT, "만료일 형식 오류: " + payload.getExpireDate());
        }

        return payload;
    }

    /* ── 검증만 (exception 없이 boolean 반환) ────────────────── */
    public static boolean isValid(String secret, String code, String expectedBuyerId) {
        try {
            verify(secret, code, expectedBuyerId);
            return true;
        } catch (LicenseException e) {
            log.warn("[LicenseUtil] 검증 실패: {} - {}", e.getReason(), e.getMessage());
            return false;
        }
    }
}
