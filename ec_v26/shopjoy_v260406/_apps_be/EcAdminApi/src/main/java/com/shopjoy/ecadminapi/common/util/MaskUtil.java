package com.shopjoy.ecadminapi.common.util;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 민감정보(연락처/이메일/이름/계좌/주소) 마스킹 공통 유틸.
 *
 * <p><b>적용 지점 두 곳, 한 마커</b> — {@link Sensitive} 로 표시한 Dto.Item 필드는
 * (1) 화면 그리드용 JSON 응답: BO 서비스가 조회 결과 리스트/단건에 {@link #applyMask} 호출
 * (2) 엑셀 다운로드: {@code ExcelExportUtil.readField()} 안에서 자동 적용
 * 두 경로 모두 이 클래스 하나로 처리된다 — 마스킹 규칙을 두 번 구현하지 않는다.
 *
 * <p>{@link SecurityUtil#hasSensitiveViewAuth()} 가 true(원본 열람 권한 보유)면 아무 것도
 * 하지 않는다 — 마스킹은 "권한 없음"에 대한 방어이지, 항상 켜지는 표시 규칙이 아니다.
 */
public final class MaskUtil {

    private MaskUtil() {}

    /** {@link Sensitive#value()} 로 사용 가능한 타입 — 문서용 상수, 검증에는 안 쓴다(오타 시 default 처리로 폴백). */
    public static final Set<String> MASK_TYPES = Set.of("phone", "email", "name", "account", "address");

    /** 클래스별 @Sensitive 필드 reflection 캐시 — 매 호출마다 다시 스캔하지 않도록 */
    private static final Map<Class<?>, List<Field>> SENSITIVE_FIELD_CACHE = new ConcurrentHashMap<>();

    // ════════════════════════════════════════════════════════════════════
    //  타입별 마스킹 규칙
    // ════════════════════════════════════════════════════════════════════

    /**
     * 값 하나를 타입에 맞게 마스킹한다. null/blank 는 그대로 반환(마스킹할 실체가 없음).
     *
     * @param value 원본 문자열
     * @param type  {@link Sensitive#value()} 에 지정한 타입 (phone/email/name/account/address). 모르는 타입이면 일괄 "***"
     */
    public static String mask(String value, String type) {
        if (value == null || value.isBlank()) return value;
        return switch (type == null ? "" : type) {
            case "phone"   -> maskPhone(value);
            case "email"   -> maskEmail(value);
            case "name"    -> maskName(value);
            case "account" -> maskAccount(value);
            case "address" -> maskAddress(value);
            default        -> "***";
        };
    }

    /** 010-1234-5678 / 01012345678 → 010-****-5678 (뒤 4자리만 남김, 나머지 숫자는 *) */
    private static String maskPhone(String v) {
        String digits = v.replaceAll("[^0-9]", "");
        if (digits.length() < 7) return "***";
        String head = digits.substring(0, 3);
        String tail = digits.substring(digits.length() - 4);
        return head + "-****-" + tail;
    }

    /** hong@test.com → ho***@test.com (로컬파트 앞 2자만 남김, 도메인은 유지) */
    private static String maskEmail(String v) {
        int at = v.indexOf('@');
        if (at <= 0) return "***";
        String local = v.substring(0, at);
        String domain = v.substring(at);
        String visible = local.length() <= 2 ? local.substring(0, 1) : local.substring(0, 2);
        return visible + "***" + domain;
    }

    /** 홍길동 → 홍*동 (첫/끝 글자만 남김, 2자면 첫 글자만 남김) */
    private static String maskName(String v) {
        String s = v.trim();
        int len = s.length();
        if (len <= 1) return s;
        if (len == 2) return s.charAt(0) + "*";
        StringBuilder sb = new StringBuilder();
        sb.append(s.charAt(0));
        sb.append("*".repeat(len - 2));
        sb.append(s.charAt(len - 1));
        return sb.toString();
    }

    /** 110-123-456789 → 110-***-***789 (숫자 구간 중 마지막 3자리만 남김, 구분자는 유지) */
    private static String maskAccount(String v) {
        String digits = v.replaceAll("[^0-9]", "");
        if (digits.length() <= 3) return "***";
        int keepTail = 3;
        StringBuilder result = new StringBuilder();
        int digitIdx = 0;
        int totalDigits = digits.length();
        for (char c : v.toCharArray()) {
            if (Character.isDigit(c)) {
                boolean keep = digitIdx >= totalDigits - keepTail;
                result.append(keep ? c : '*');
                digitIdx++;
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }

    /** 서울시 강남구 역삼동 123 → 서울시 강남구 *** (앞 2토큰만 남김) */
    private static String maskAddress(String v) {
        String[] tokens = v.trim().split("\\s+");
        if (tokens.length <= 2) return "***";
        return tokens[0] + " " + tokens[1] + " ***";
    }

    // ════════════════════════════════════════════════════════════════════
    //  Dto.Item 리스트/단건 일괄 마스킹 — 화면 그리드(JSON 응답) 경로에서 사용
    // ════════════════════════════════════════════════════════════════════

    /**
     * 리스트 내 각 항목의 {@link Sensitive} 마킹 필드를 in-place 마스킹한다.
     * DB 조회 직후의 신선한 Dto.Item 인스턴스에만 호출할 것 — 캐시/공유 객체에 쓰면 원본이 오염된다.
     *
     * <p>{@link SecurityUtil#hasSensitiveViewAuth()} 가 true 면 아무 것도 하지 않고 그대로 반환한다.
     */
    public static <T> void applyMask(List<T> items) {
        if (items == null || items.isEmpty()) return;
        if (SecurityUtil.hasSensitiveViewAuth()) return;
        List<Field> fields = sensitiveFieldsOf(items.get(0).getClass());
        if (fields.isEmpty()) return;
        for (T item : items) {
            for (Field f : fields) {
                maskFieldInPlace(item, f);
            }
        }
    }

    /** 단건 버전 — {@link #applyMask(List)} 위임 */
    public static <T> void applyMask(T item) {
        if (item == null) return;
        applyMask(new ArrayList<>(List.of(item)));
    }

    /** Collection 버전 — Set 등 List 아닌 컬렉션도 받기 위함 */
    public static <T> void applyMaskAll(Collection<T> items) {
        if (items == null || items.isEmpty()) return;
        applyMask(new ArrayList<>(items));
    }

    private static void maskFieldInPlace(Object item, Field f) {
        try {
            Object raw = f.get(item);
            if (raw == null) return;
            String maskType = f.getAnnotation(Sensitive.class).value();
            f.set(item, mask(String.valueOf(raw), maskType));
        } catch (IllegalAccessException ignore) {
            // reflection 접근 실패 시 원본 유지 — 화면이 죽는 것보다 안전
        }
    }

    private static List<Field> sensitiveFieldsOf(Class<?> cls) {
        return SENSITIVE_FIELD_CACHE.computeIfAbsent(cls, c -> {
            List<Field> list = new ArrayList<>();
            for (Field f : c.getDeclaredFields()) {
                if (f.isAnnotationPresent(Sensitive.class)) {
                    f.setAccessible(true);
                    list.add(f);
                }
            }
            return list;
        });
    }

    // ════════════════════════════════════════════════════════════════════
    //  단일 필드 값 마스킹 — 엑셀 export 경로(ExcelExportUtil.readField)에서 사용
    // ════════════════════════════════════════════════════════════════════

    /**
     * reflection 으로 이미 읽은 값을 필드의 {@link Sensitive} 마킹 여부에 따라 마스킹한다.
     * 마킹이 없거나 권한이 있으면 원본 그대로 반환.
     */
    public static Object maskIfSensitive(Field f, Object value) {
        if (f == null || value == null) return value;
        Sensitive s = f.getAnnotation(Sensitive.class);
        if (s == null) return value;
        if (SecurityUtil.hasSensitiveViewAuth()) return value;
        return mask(String.valueOf(value), s.value());
    }
}
