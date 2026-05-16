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
 * 라이선스 코드 생성·서명·검증 유틸리티.
 *
 * <p>역할: {@link LicensePayload} 를 비밀키(secret) 기반 HMAC-SHA256 으로 서명하여
 * 단일 문자열 라이선스 코드를 만들고({@link #generateCode}), 역으로 코드의 무결성·
 * 소유자·만료를 검증한다({@link #verify} / {@link #isValid}).</p>
 *
 * <p>코드 구조:
 * <pre>
 *   licenseCode = Base64(JSON payload) + '.' + HMAC-SHA256(Base64부분) 앞 16자
 *   payload     = { siteType, siteId, siteNo, buyerId, expireDate }
 * </pre></p>
 *
 * <p>검증 순서(어느 단계에서 막혔는지가 {@link LicenseException.Reason} 으로 구분됨):
 * <ol>
 *   <li>코드 존재/형식({@code Base64.서명} 2분할)</li>
 *   <li>HMAC 서명 일치 여부 — secret 없이는 위조 불가</li>
 *   <li>payload Base64 디코딩·파싱</li>
 *   <li>buyerId 일치 여부(타 구매자/사이트 재사용 차단)</li>
 *   <li>만료일 {@code expireDate >= today}</li>
 * </ol></p>
 *
 * <p>보안 주의: secret 은 라이선스 위조 가능성과 직결되는 최상위 비밀이며 코드·로그에
 * 노출되면 안 된다(운영은 {@code application.yml} 의 {@code app.license.secret}
 * 환경변수 주입). 서명은 SHA-256 전체가 아니라 앞 16자(64bit)만 사용하는데,
 * 코드 길이 단축을 위한 트레이드오프이며 secret 기밀성이 보안의 핵심 전제다.</p>
 */
@Slf4j
public final class LicenseUtil {

    /** 유틸 클래스 — 인스턴스화 금지(정적 메서드 전용). */
    private LicenseUtil() {}

    /**
     * 데이터를 HMAC-SHA256 으로 서명한 뒤 16진수 문자열의 앞 16자를 반환한다.
     *
     * <p>동작: secret 을 키로 한 {@code HmacSHA256} MAC 을 UTF-8 바이트에 대해
     * 계산하고, 결과를 hex 인코딩한 뒤 선두 16자를 잘라 코드 길이를 줄인다.
     * 생성·검증 양쪽에서 동일하게 호출되어야 서명이 일치한다.</p>
     *
     * <p>설계 근거: 16자(8바이트)로 절단하는 것은 코드 가독성/길이 절충이다.
     * 위조 난이도는 secret 의 기밀성에 의존한다.</p>
     *
     * @param secret HMAC 비밀키(절대 노출 금지)
     * @param data   서명 대상 문자열(보통 Base64 인코딩된 payload)
     * @return hex 서명 문자열의 앞 16자
     * @throws IllegalStateException HMAC 알고리즘 미지원 등 암호화 처리 실패 시
     */
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

    /**
     * payload 를 직렬화·인코딩·서명하여 최종 라이선스 코드를 생성한다.
     *
     * <p>처리: payload → JSON({@link LicensePayload#toJson}) → UTF-8 → Base64
     * 인코딩(b64) → b64 에 대한 HMAC 서명(sig) → {@code b64 + "." + sig} 반환.
     * payload 는 비밀이 아니며(Base64는 인코딩일 뿐 암호화 아님), 무결성은 sig 가
     * 보장한다 — b64 한 글자라도 변조하면 서명 검증에서 탈락한다.</p>
     *
     * @param secret  HMAC 비밀키(검증 측과 동일해야 함)
     * @param payload 서명 대상 라이선스 정보
     * @return {@code Base64(JSON).서명16자} 형태의 라이선스 코드
     */
    /* ── 코드 생성 ────────────────────────────────────────────── */
    public static String generateCode(String secret, LicensePayload payload) {
        String json  = payload.toJson();
        String b64   = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        String sig   = sign(secret, b64);
        return b64 + "." + sig;
    }

    /**
     * 라이선스 코드를 전 단계 검증하고, 통과 시 payload 를 반환한다.
     *
     * <p>검증 단계와 각 단계의 의도(실패 시 던지는 {@link LicenseException.Reason}):</p>
     * <ol>
     *   <li><b>존재 확인</b> — code 가 null/빈 값이면 라이선스 미주입
     *       → {@code NO_HEADER}.</li>
     *   <li><b>형식 확인</b> — {@code "."} 기준 2분할(Base64부분, 서명부분)이
     *       아니면 손상된 코드 → {@code INVALID_FORMAT}.</li>
     *   <li><b>서명 검증</b> — {@code sign(secret, b64)} 재계산값이 코드 내 서명과
     *       다르면 위·변조 → {@code INVALID_SIGNATURE}. secret 없이는 통과 불가
     *       하므로 임의 생성 코드를 원천 차단한다.</li>
     *   <li><b>payload 파싱</b> — Base64 디코딩/JSON 파싱 실패 시
     *       → {@code INVALID_FORMAT}.</li>
     *   <li><b>buyerId 일치</b> — 기대 buyerId 가 주어졌고 payload 와 다르면 타
     *       구매자/사이트 라이선스 재사용 → {@code SITE_MISMATCH}. (기대값이
     *       null/빈 값이면 이 검사는 생략 — 헤더 미동반 호출 경로 호환.)</li>
     *   <li><b>만료 확인</b> — {@code expireDate} 파싱 후 오늘이 만료일을 지났으면
     *       → {@code EXPIRED}. 날짜 형식 자체가 깨졌으면 → {@code INVALID_FORMAT}
     *       (내부적으로 던진 {@link LicenseException} 은 그대로 재전파하기 위해
     *       먼저 catch 하여 분기한다).</li>
     * </ol>
     *
     * @param secret          HMAC 비밀키(생성 측과 동일해야 함)
     * @param code            검증 대상 라이선스 코드({@code Base64.서명})
     * @param expectedBuyerId 기대 구매자 ID(헤더 {@code X-Buyer-Id}); null/빈 값이면
     *                        소유자 검사 생략
     * @return 모든 검증을 통과한 {@link LicensePayload}
     * @throws LicenseException 위 단계 중 하나라도 실패 시(사유는 {@code reason} 참조)
     */
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

    /**
     * {@link #verify} 를 호출하되 예외 대신 boolean 으로 결과를 반환한다.
     *
     * <p>검증 흐름은 {@link #verify} 와 동일하다. 실패 시 예외를 삼키고 사유를
     * {@code warn} 로그로만 남긴 뒤 {@code false} 를 반환한다 — 분기 처리만 필요한
     * 호출부(예: 조건부 노출)에서 사용한다. 실패 원인을 호출부에서 분류해야 한다면
     * 이 메서드 대신 {@link #verify} 를 사용한다.</p>
     *
     * @param secret          HMAC 비밀키
     * @param code            검증 대상 라이선스 코드
     * @param expectedBuyerId 기대 구매자 ID(null/빈 값이면 소유자 검사 생략)
     * @return 모든 검증 통과 시 {@code true}, 그 외 {@code false}
     */
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
