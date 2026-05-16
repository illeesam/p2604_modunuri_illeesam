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
 *
 * <p>역할/책임: 프로젝트 전반에서 재사용하는 정적 헬퍼 모음.
 * <ul>
 *   <li>예외 메시지용 Service 도메인/호출지점 추출(svcDomain/svcCallerInfo)</li>
 *   <li>파라미터 Map 조립/필수값 검증(params/require)</li>
 *   <li>'^' 구분 이름 파싱(parseNames)</li>
 *   <li>null/empty 안전 기본값(nvl 계열)</li>
 *   <li>테이블명 기반 ID 생성(generateId)</li>
 * </ul>
 *
 * <p>주의사항: 인스턴스화 불가(private 생성자). 모든 메서드는 static.
 */
public class CmUtil {

    /** 유틸 클래스 — 인스턴스화 금지. */
    private CmUtil() {}

    /**
     * Service 빈의 도메인 이름을 추출. (CmBizException 메시지에 ::도메인 접미사 용도)
     * <pre>
     * SyCodeGrpService → syCodeGrp
     * FoMyPageService  → foMyPage
     * </pre>
     * Spring CGLIB 프록시 클래스명("XxxService$$EnhancerBySpringCGLIB$$...") 도 안전 처리.
     *
     * @param svc Service 빈 인스턴스 (null 이면 빈 문자열 반환)
     * @return 첫 글자 소문자화된 도메인명. 'Service' 접미사·CGLIB 프록시 접미사 제거. 추출 불가 시 ""
     */
    public static String svcDomain(Object svc) {
        if (svc == null) return "";
        String name = svc.getClass().getSimpleName();
        // CGLIB 프록시 처리: 'XxxService$$EnhancerBySpringCGLIB$$abcd1234' → 'XxxService'
        int dollarIdx = name.indexOf('$');
        if (dollarIdx >= 0) name = name.substring(0, dollarIdx);
        // 'Service' 접미사 제거
        if (name.endsWith("Service")) name = name.substring(0, name.length() - "Service".length());
        if (name.isEmpty()) return "";
        return Character.toLowerCase(name.charAt(0)) + name.substring(1);
    }

    /**
     * Service 빈의 도메인 + 호출 메서드명 + 라인번호 추출.
     * <pre>
     * SyCodeGrpService.getById:31 호출 → "syCodeGrp::getById:31"
     * FoMyPageService.changePassword:80 호출 → "foMyPage::changePassword:80"
     * </pre>
     * StackWalker (Java 9+) 사용. CGLIB 프록시 클래스명도 안전 처리.
     *
     * <p>skip(1) 로 svcCallerInfo 자신의 스택 프레임을 건너뛰어 직전 호출자(Service 메서드)를 얻는다.
     *
     * @param svc Service 빈 인스턴스
     * @return {@code 도메인::메서드명:라인번호}. 호출 프레임을 얻지 못하면 도메인명만 반환
     */
    public static String svcCallerInfo(Object svc) {
        String domain = svcDomain(svc);
        StackWalker walker = StackWalker.getInstance(StackWalker.Option.RETAIN_CLASS_REFERENCE);
        // skip(1) — svcCallerInfo 자체 프레임 제외 → 호출자 = Service 메서드
        StackWalker.StackFrame frame = walker.walk(s -> s.skip(1).findFirst().orElse(null));
        if (frame == null) return domain;
        return domain + "::" + frame.getMethodName() + ":" + frame.getLineNumber();
    }

    /**
     * 페이징 파라미터 추가 (구버전 호환용 위임).
     *
     * @param p 쿼리 파라미터 Map
     * @deprecated {@link PageHelper#addPaging(Map)} 를 직접 사용할 것
     */
    @Deprecated
    public static void addPaging(Map<String, Object> p) {
        PageHelper.addPaging(p);
    }

    /**
     * null·빈 문자열을 무시하며 파라미터 Map 생성.
     *
     * <p>키/값 쌍을 가변인자로 받아 짝지어 넣는다. 값이 String 이면 blank 일 때 제외,
     * 그 외 타입이면 null 일 때만 제외한다. 마지막 원소가 짝이 안 맞으면(홀수 개) 무시된다
     * (반복 조건 {@code i < length - 1}).
     *
     * <p>사용: {@code CmUtil.params("siteId", siteId, "searchValue", searchValue, ...)}
     *
     * @param keyValues 키, 값, 키, 값 ... 순서의 가변인자 (키는 toString 으로 문자열화)
     * @return null/blank 가 제거된 HashMap
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
     * 필수 파라미터 존재 여부 검증. 없으면 {@link CmBizException}(400).
     *
     * <p>값이 null 이거나 toString 결과가 blank 면 누락으로 간주한다.
     *
     * <p>사용: {@code CmUtil.require(p, "siteId", "searchValue")}
     *
     * @param p    검증 대상 파라미터 Map
     * @param keys 필수 키 목록
     * @throws CmBizException 하나라도 누락/blank 인 경우 (가장 먼저 발견된 키 메시지)
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
     * '^' 구분자로 이름 파싱 (예: {@code "auth^user^role"} → {@code ["auth","user","role"]}).
     *
     * <p>각 토큰은 trim 되고 빈 토큰은 결과에서 제외된다.
     *
     * @param names '^' 로 연결된 문자열 (null/blank 면 빈 리스트)
     * @return 파싱된 이름 리스트
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
     * null·빈 문자열을 기본값으로 치환.
     *
     * @param value        검사할 문자열
     * @param defaultValue value 가 null/empty 일 때 반환할 기본값
     * @return value 가 null/empty 면 defaultValue, 아니면 value
     */
    public static String nvl(String value, String defaultValue) {
        return (value == null || value.isEmpty()) ? defaultValue : value;
    }

    /**
     * null·빈 문자열을 "" 로 치환.
     *
     * @param value 검사할 문자열
     * @return value 가 null/empty 면 "", 아니면 value
     */
    public static String nvl(String value) {
        return nvl(value, "");
    }

    /**
     * List null 치환.
     *
     * @param value        검사할 리스트
     * @param defaultValue null 일 때 반환할 기본 리스트
     * @return value 가 null 이면 defaultValue, 아니면 value (빈 리스트는 그대로 반환)
     */
    public static <T> List<T> nvlList(List<T> value, List<T> defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    /**
     * List null 치환 (기본값: 새 빈 ArrayList).
     *
     * @param value 검사할 리스트
     * @return value 가 null 이면 새 빈 리스트, 아니면 value
     */
    public static <T> List<T> nvlList(List<T> value) {
        return nvlList(value, new ArrayList<>());
    }

    /**
     * Integer null 치환.
     *
     * @param value        검사할 값
     * @param defaultValue null 일 때 반환할 기본값
     * @return value 가 null 이면 defaultValue, 아니면 value
     */
    public static Integer nvlInt(Integer value, Integer defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    /**
     * Integer null 치환 (기본값 0).
     *
     * @param value 검사할 값
     * @return value 가 null 이면 0, 아니면 value
     */
    public static Integer nvlInt(Integer value) {
        return nvlInt(value, 0);
    }

    /**
     * Long null 치환.
     *
     * @param value        검사할 값
     * @param defaultValue null 일 때 반환할 기본값
     * @return value 가 null 이면 defaultValue, 아니면 value
     */
    public static Long nvlLong(Long value, Long defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    /**
     * Long null 치환 (기본값 0L).
     *
     * @param value 검사할 값
     * @return value 가 null 이면 0L, 아니면 value
     */
    public static Long nvlLong(Long value) {
        return nvlLong(value, 0L);
    }

    /**
     * Boolean null 치환.
     *
     * @param value        검사할 값
     * @param defaultValue null 일 때 반환할 기본값
     * @return value 가 null 이면 defaultValue, 아니면 value
     */
    public static Boolean nvlBool(Boolean value, Boolean defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    /**
     * Boolean null 치환 (기본값 false).
     *
     * @param value 검사할 값
     * @return value 가 null 이면 false, 아니면 value
     */
    public static Boolean nvlBool(Boolean value) {
        return nvlBool(value, false);
    }

    /**
     * Map null 치환.
     *
     * @param value        검사할 Map
     * @param defaultValue null 일 때 반환할 기본 Map
     * @return value 가 null 이면 defaultValue, 아니면 value
     */
    public static <K, V> Map<K, V> nvlMap(Map<K, V> value, Map<K, V> defaultValue) {
        return (value == null) ? defaultValue : value;
    }

    /**
     * Map null 치환 (기본값: 새 빈 HashMap).
     *
     * @param value 검사할 Map
     * @return value 가 null 이면 새 빈 HashMap, 아니면 value
     */
    public static <K, V> Map<K, V> nvlMap(Map<K, V> value) {
        return nvlMap(value, new HashMap<>());
    }

    /** ID 타임스탬프 포맷 — yyMMddHHmmss(12자리). */
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /**
     * 테이블명 기반 ID 생성: {@code prefix + yyMMddHHmmss(12) + rand4(4)} 최대 21자.
     *
     * <p>prefix 는 테이블명을 '_' 로 split 한 뒤 도메인(0번)을 제외하고
     * 1번 세그먼트 앞 2글자 + 이후 세그먼트 각 1글자를 최대 5글자(대문자)로 조합한다.
     * prefix 추출 실패 시 "XX", 5자 초과 시 앞 5자로 절단.
     *
     * <p>예: {@code "syh_user_login_hist"} → {@code "USLH" + "240610153045" + "1234"}
     * → {@code "USLH2406101530451234"}.
     *
     * <p>rand4 는 0~9999 를 4자리 zero-pad — 동일 초 충돌 완화용(완전 유일성 보장 아님).
     *
     * @param tableNm 대상 테이블명 (snake_case)
     * @return 생성된 ID 문자열
     */
    public static String generateId(String tableNm) {
        String prefix = extractPrefix(tableNm);
        if (prefix == null || prefix.isBlank()) prefix = "XX";
        if (prefix.length() > 5) prefix = prefix.substring(0, 5);
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return prefix + ts + rand;
    }

    /**
     * 테이블명에서 ID prefix 추출.
     *
     * <p>규칙: '_' split 후 0번 인덱스(도메인 prefix, 예: sy/ec/syh)는 제외.
     * 1번 세그먼트는 앞 2자, 2번 이후는 각 앞 1자를 누적해 최대 5자(대문자) 생성.
     *
     * @param tableNm 테이블명 (null/blank 면 "XX")
     * @return 대문자 prefix (최대 5자)
     */
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
