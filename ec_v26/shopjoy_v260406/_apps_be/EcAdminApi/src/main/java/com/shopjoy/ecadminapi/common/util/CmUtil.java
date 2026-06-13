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
     * Service의 update/delete/save 메서드 진입부에서 식별자(ID) null/blank 검증.
     *
     * <p>호출 예: {@code CmUtil.requireId(id, "userId", this);} → id 누락 시 즉시 예외.
     *
     * <p>키 누락을 조용히 무시하면 잘못된 행을 갱신하거나 saveList 의 일부 row 가 사라지는
     * 데이터 무결성 사고로 이어지므로, 반드시 명시적 예외로 차단한다.
     *
     * @param id      검증할 식별자 값
     * @param idName  필드명(예: "userId") — 예외 메시지에 표시
     * @param svc     호출 Service 인스턴스(스택 추적용, {@code this} 전달)
     * @throws CmBizException id 가 null 또는 blank 인 경우
     */
    public static void requireId(Object id, String idName, Object svc) {
        if (id == null || (id instanceof String && ((String) id).isBlank())) {
            throw new CmBizException(idName + " 가 필요합니다." + "::" + svcCallerInfo(svc));
        }
    }

    /**
     * saveList 의 U/D row 들에 대해 ID 가 모두 채워졌는지 일괄 검증.
     *
     * <p>키가 비어 있는 row 가 하나라도 있으면 인덱스와 함께 예외 메시지를 구성한다.
     * 조용히 filter 로 제외하던 기존 패턴 대신 클라이언트 누락을 명시적으로 차단.
     *
     * @param rows         검증 대상 row 목록 (null/empty 면 통과)
     * @param idExtractor  각 row 에서 ID 를 추출하는 함수 (예: {@code SyUser::getUserId})
     * @param rowStatus    검증할 상태 코드(보통 "U" 또는 "D")
     * @param idName       필드명(예: "userId") — 예외 메시지에 표시
     * @param svc          호출 Service 인스턴스
     * @param <T>          row 타입
     * @throws CmBizException 해당 상태 row 중 하나라도 ID 가 비어 있는 경우
     */
    public static <T> void requireRowIds(List<T> rows,
                                          java.util.function.Function<T, ?> idExtractor,
                                          String rowStatus, String idName, Object svc) {
        if (rows == null || rows.isEmpty()) return;
        List<Integer> badIdx = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            T r = rows.get(i);
            if (r == null) continue;
            try {
                // rowStatus 필드 — BaseEntity 의 getRowStatus 로 얻는 게 정석이지만 generic 회피용 reflection
                java.lang.reflect.Method m = r.getClass().getMethod("getRowStatus");
                Object rs = m.invoke(r);
                if (!java.util.Objects.equals(rowStatus, rs)) continue;
            } catch (Exception ignore) {
                continue;
            }
            Object id = idExtractor.apply(r);
            if (id == null || (id instanceof String && ((String) id).isBlank())) {
                badIdx.add(i);
            }
        }
        if (!badIdx.isEmpty()) {
            throw new CmBizException(
                "saveList[" + rowStatus + "] " + idName + " 누락 row index=" + badIdx
                + "::" + svcCallerInfo(svc));
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

    /**
     * 템플릿 본문의 {key} 플레이스홀더를 params 값으로 치환.
     *
     * <p>예: "안녕하세요 {name}님" + {name=홍길동} → "안녕하세요 홍길동님".
     * params 에 없는 키나 null 값은 빈 문자열로 치환한다. template 가 null 이면 빈 문자열 반환.
     *
     * @param template 치환 대상 템플릿 (예: "...{name}...{inquiryType}...")
     * @param params   치환 파라미터 맵 (key → value)
     * @return 치환 완료 문자열
     */
    public static String fillTemplate(String template, Map<String, Object> params) {
        if (template == null) return "";
        if (params == null || params.isEmpty()) return template;
        String result = template;
        for (Map.Entry<String, Object> e : params.entrySet()) {
            Object v = e.getValue();
            result = result.replace("{" + e.getKey() + "}", v == null ? "" : String.valueOf(v));
        }
        return result;
    }

    /**
     * 간단한 Map → JSON 문자열 직렬화 (발송 로그 params 컬럼 저장용).
     *
     * <p>값은 모두 문자열로 따옴표 감싸 직렬화하며, 따옴표/역슬래시만 이스케이프한다.
     * 외부 노출용이 아닌 로그 저장용이므로 중첩 객체는 지원하지 않는다.
     *
     * @param params 직렬화할 맵 (null/empty 면 "{}")
     * @return JSON 문자열
     */
    public static String toJsonParams(Map<String, Object> params) {
        if (params == null || params.isEmpty()) return "{}";
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : params.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(jsonEsc(e.getKey())).append("\":");
            Object v = e.getValue();
            sb.append("\"").append(v == null ? "" : jsonEsc(String.valueOf(v))).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private static String jsonEsc(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    /**
     * 예외의 원인 체인을 펼쳐 사람이 읽을 수 있는 한 줄 메시지로 만든다 (발송 실패사유 저장용).
     *
     * <p>최상위 예외 메시지 + 하위 cause 들의 메시지를 " ⇐ " 로 연결한다. 메일 인증 실패처럼
     * 최상위는 "Authentication failed" 로 짧고 실제 SMTP 응답(예: "535-5.7.8 ...")이 cause 에 있는
     * 케이스에서 원인까지 보존한다. 동일 메시지 중복·null 은 건너뛰고, max 길이로 자른다.
     *
     * @param t   예외 (null 이면 "")
     * @param max 최대 길이 (초과 시 잘라냄)
     * @return 원인 체인이 펼쳐진 메시지
     */
    public static String describeError(Throwable t, int max) {
        if (t == null) return "";
        StringBuilder sb = new StringBuilder();
        String prev = null;
        int depth = 0;
        for (Throwable c = t; c != null && depth < 6; c = c.getCause(), depth++) {
            String msg = c.getMessage();
            if (msg == null || msg.isBlank()) msg = c.getClass().getSimpleName();
            msg = msg.trim();
            if (msg.equals(prev)) continue;   // 동일 메시지 반복 생략
            if (sb.length() > 0) sb.append(" ⇐ ");
            sb.append(msg);
            prev = msg;
        }
        String result = sb.toString();
        return result.length() <= max ? result : result.substring(0, max);
    }

}
