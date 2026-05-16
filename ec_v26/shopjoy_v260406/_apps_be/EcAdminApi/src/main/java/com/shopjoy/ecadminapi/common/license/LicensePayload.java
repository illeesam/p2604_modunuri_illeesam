package com.shopjoy.ecadminapi.common.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 라이선스 코드의 payload(서명 대상 원문 데이터).
 *
 * <p>역할: 라이선스가 누구(buyerId)에게, 어느 사이트(siteType/siteId/siteNo)에,
 * 언제까지(expireDate) 유효한지를 담는 값 객체. 이 객체를 JSON 직렬화 → Base64
 * 인코딩한 문자열이 HMAC-SHA256 서명 대상이 되며, {@code Base64(JSON).서명} 형태로
 * 최종 라이선스 코드가 만들어진다({@link LicenseUtil} 참조).</p>
 *
 * <p>설계 근거: Jackson 등 외부 라이브러리 의존 없이 {@link #toJson()} /
 * {@link #fromJson(String)} 로 직접 직렬화한다. 라이선스 생성기/검증기를 Spring
 * 컨텍스트 없이 단독 실행(CLI)할 수 있어야 하므로 의존성을 최소화한 것이다.
 * 필드 순서·키 이름이 그대로 서명 입력이 되므로 toJson 의 출력 포맷을 임의로
 * 바꾸면 기존에 발급된 코드의 서명이 모두 깨진다(하위 호환 주의).</p>
 *
 * <p>보안 주의: payload 자체는 Base64(평문) 이므로 비밀이 아니다. 위·변조 방지는
 * 오로지 HMAC 서명에 의존한다 — 서명 검증 없이 payload 값을 신뢰하면 안 된다.</p>
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicensePayload {

    /** 사이트 유형 — {@code "BO"}(관리자) 또는 {@code "FO"}(사용자). */
    private String siteType;    // "BO" | "FO"
    /** 사이트 ID(예: {@code SITE_BO_01}). 검증 시 헤더/요청 사이트와 대조. */
    private String siteId;      // 사이트 ID
    /** 사이트 번호(예: {@code 01}). FRONT_SITE_NO 등 멀티사이트 식별용. */
    private String siteNo;      // 사이트 번호
    /** 구매자 ID. 검증 시 {@code X-Buyer-Id} 헤더와 일치해야 함(타 구매자 재사용 차단). */
    private String buyerId;     // 구매자 ID
    /** 만료일 {@code YYYY-MM-DD}. {@code LocalDate.parse} 가능한 ISO 형식이어야 함. */
    private String expireDate;  // 만료일 (YYYY-MM-DD)

    /**
     * payload 를 고정 키 순서의 JSON 문자열로 직렬화한다.
     *
     * <p>외부 라이브러리 없이 문자열을 직접 조립한다. 출력되는 키 순서
     * ({@code siteType, siteId, siteNo, buyerId, expireDate})와 포맷이 곧 HMAC
     * 서명 입력이므로, 이 메서드의 출력 형식을 변경하면 기존 발급 코드의 서명이
     * 무효화된다. 값에 포함된 {@code \\} 와 {@code "} 는 {@link #esc(String)} 로
     * 이스케이프하여 JSON 깨짐을 방지한다. null 필드는 빈 문자열로 직렬화된다.</p>
     *
     * @return 직렬화된 JSON 문자열(서명 대상 원문)
     */
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

    /**
     * {@link #toJson()} 로 만든 JSON 문자열을 다시 payload 로 역직렬화한다.
     *
     * <p>정규 JSON 파서가 아니라 {@code "key":"value"} 패턴을 키별로 단순 추출하는
     * 방식이다({@link #extract}). 본 클래스가 직접 생성한 평탄(flat)·이스케이프된
     * 문자열만 입력으로 가정하므로 중첩 구조·숫자/불리언 타입은 지원하지 않는다.
     * 키가 없으면 해당 필드는 빈 문자열로 채워진다(예외를 던지지 않음 → 상위에서
     * siteId/buyerId 등으로 유효성 판정).</p>
     *
     * @param json {@link #toJson()} 형식의 JSON 문자열(Base64 디코딩 결과)
     * @return 파싱된 {@link LicensePayload}(누락 필드는 빈 문자열)
     */
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

    /**
     * JSON 문자열에서 {@code "key":"..."} 패턴의 값을 추출한다.
     *
     * <p>{@code "key":"} 토큰의 시작 인덱스를 찾고, 그 뒤 첫 {@code "} 까지를
     * 값으로 잘라낸다. 키가 없거나 닫는 따옴표가 없으면 빈 문자열을 반환한다.
     * 단순 indexOf 기반이라 값 내부에 이스케이프된 따옴표가 있으면 잘못 잘릴 수
     * 있으나, 본 클래스가 생성하는 제한된 문자열만 다루므로 실사용상 안전하다.</p>
     *
     * @param json 대상 JSON 문자열
     * @param key  추출할 키 이름
     * @return 추출된 값(없으면 빈 문자열)
     */
    private static String extract(String json, String key) {
        String token = "\"" + key + "\":\"";
        int s = json.indexOf(token);
        if (s < 0) return "";
        s += token.length();
        int e = json.indexOf("\"", s);
        return e < 0 ? "" : json.substring(s, e);
    }

    /**
     * JSON 문자열 값에 들어갈 수 있는 특수문자를 이스케이프한다.
     *
     * <p>역슬래시({@code \\})를 먼저 치환한 뒤 큰따옴표({@code "})를 치환하는
     * 순서가 중요하다 — 순서를 바꾸면 이미 추가된 이스케이프 백슬래시가 다시
     * 이스케이프되어 깨진다. null 입력은 빈 문자열로 정규화한다.</p>
     *
     * @param v 원본 값(null 허용)
     * @return JSON 안전 문자열(null → "")
     */
    private static String esc(String v) {
        return v == null ? "" : v.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
