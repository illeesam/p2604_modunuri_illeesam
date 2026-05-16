package com.shopjoy.ecadminapi.common.util;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * VO/DTO/Map → Entity 필드 자동 복사 유틸.
 *
 * 용도:
 * 1. Request Body(VO/DTO/Map)의 필드를 Entity로 자동 복사
 * 2. null 값은 복사하지 않음 (선택적 수정만 반영)
 * 3. 타입 검증으로 잘못된 필드 주입 방지
 *
 * 예시:
 *   MbMember entity = repository.findById(id).orElseThrow(...);
 *   // VO 방식
 *   MbMemberVo vo = (MbMemberVo) body;
 *   VoUtil.voCopy(vo, entity);
 *   // Map 방식
 *   Map<String, Object> mapBody = (Map<String, Object>) body;
 *   VoUtil.mapCopy(mapBody, entity);
 *   repository.save(entity);
 *
 * <p>공통 동작 규칙(모든 copy 메서드):
 * <ul>
 *   <li>source/target 중 하나라도 null 이면 target 을 그대로 반환(무동작)</li>
 *   <li>값이 null 인 필드는 복사하지 않음 → MyBatis {@code <if test="x != null">} 와 정합</li>
 *   <li>target 에 동일 이름 필드가 없으면 무시(부분 복사 허용)</li>
 *   <li>대입 타입이 호환되지 않으면(isAssignableFrom 실패) 해당 필드 스킵</li>
 *   <li>reflection 접근 자체가 실패({@link IllegalAccessException})하면 {@link RuntimeException} 으로 래핑</li>
 * </ul>
 *
 * <p>주의사항: 인스턴스화 불가. 필드명이 정확히 일치해야 매핑된다(getter/setter 무관, 필드 직접 접근).
 * voCopy 계열은 source 의 선언 필드만(상속 필드 제외) 순회, {@link #voToMap(Object)} 만 상속 필드까지 포함.
 */
public class VoUtil {

    /** 유틸 클래스 — 인스턴스화 금지. */
    private VoUtil() {}

    /**
     * source 객체의 non-null 필드를 target 객체에 복사.
     *
     * @param source 원본 VO/DTO (요청 데이터, null 이면 target 그대로 반환)
     * @param target 대상 Entity (DB 엔티티, null 이면 그대로 반환)
     * @return target 객체 (원본 수정 후 반환)
     * @throws RuntimeException 리플렉션 필드 접근 실패 시 (IllegalAccessException 래핑)
     */
    public static <T> T voCopy(Object source, T target) {
        if (source == null || target == null) {
            return target;
        }

        Class<?> sourceClass = source.getClass();
        Class<?> targetClass = target.getClass();

        try {
            // source의 모든 필드 순회
            for (Field sourceField : sourceClass.getDeclaredFields()) {
                sourceField.setAccessible(true);
                Object value = sourceField.get(source);

                // null 값은 건너뜀 (선택적 수정)
                if (value == null) {
                    continue;
                }

                // target 클래스에서 같은 이름의 필드 찾기
                try {
                    Field targetField = targetClass.getDeclaredField(sourceField.getName());
                    targetField.setAccessible(true);

                    // 타입 호환성 확인
                    if (targetField.getType().isAssignableFrom(sourceField.getType())) {
                        targetField.set(target, value);
                    }
                } catch (NoSuchFieldException ignored) {
                    // target에 해당 필드가 없으면 무시 (부분 복사 허용)
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.voCopy() 실패: " + e.getMessage(), e);
        }

        return target;
    }

    /**
     * source 객체의 필드를 target 객체에 복사 (지정된 필드 제외).
     *
     * 사용법:
     * - voCopy(vo, entity, "id", "regBy", "regDate")  // 여러 필드 제외
     * - voCopyExclude(vo, entity, "id^regBy^regDate")  // ^로 구분된 문자열
     *
     * @param source    원본 VO/DTO
     * @param target    대상 Entity
     * @param excludes  복사하지 않을 필드명 배열 (예: "id", "regBy", "regDate")
     * @return target 객체
     * @throws RuntimeException 리플렉션 필드 접근 실패 시
     */
    public static <T> T voCopy(Object source, T target, String... excludes) {
        if (source == null || target == null) {
            return target;
        }

        java.util.Set<String> excludeSet = java.util.Arrays.stream(excludes).collect(java.util.stream.Collectors.toSet());
        Class<?> sourceClass = source.getClass();
        Class<?> targetClass = target.getClass();

        try {
            for (Field sourceField : sourceClass.getDeclaredFields()) {
                String fieldName = sourceField.getName();

                // 제외 필드 체크
                if (excludeSet.contains(fieldName)) {
                    continue;
                }

                sourceField.setAccessible(true);
                Object value = sourceField.get(source);

                if (value == null) {
                    continue;
                }

                try {
                    Field targetField = targetClass.getDeclaredField(fieldName);
                    targetField.setAccessible(true);

                    if (targetField.getType().isAssignableFrom(sourceField.getType())) {
                        targetField.set(target, value);
                    }
                } catch (NoSuchFieldException ignored) {
                    // target에 해당 필드가 없으면 무시
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.voCopy() 실패: " + e.getMessage(), e);
        }

        return target;
    }

    /**
     * Map<String, Object>의 항목을 target Entity에 복사.
     * null 값은 복사하지 않음 (선택적 수정만 반영).
     *
     * <p>타입 검증은 {@code targetField.getType().isAssignableFrom(value.getClass())} 로 수행하므로
     * Map 값이 박싱 타입과 다르면(예: target Long, value Integer) 복사되지 않음에 주의.
     *
     * @param source Map 형태의 요청 데이터 (null 이면 target 그대로 반환)
     * @param target 대상 Entity
     * @return target 객체
     * @throws RuntimeException 리플렉션 필드 접근 실패 시
     */
    public static <T> T mapCopy(java.util.Map<String, Object> source, T target) {
        if (source == null || target == null) {
            return target;
        }

        Class<?> targetClass = target.getClass();

        try {
            for (java.util.Map.Entry<String, Object> entry : source.entrySet()) {
                String fieldName = entry.getKey();
                Object value = entry.getValue();

                // null 값은 건너뜀
                if (value == null) {
                    continue;
                }

                try {
                    Field targetField = targetClass.getDeclaredField(fieldName);
                    targetField.setAccessible(true);

                    // 타입 호환성 확인
                    if (targetField.getType().isAssignableFrom(value.getClass())) {
                        targetField.set(target, value);
                    }
                } catch (NoSuchFieldException ignored) {
                    // target에 해당 필드가 없으면 무시 (부분 복사 허용)
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.mapCopy() 실패: " + e.getMessage(), e);
        }

        return target;
    }

    /**
     * Map<String, Object>의 항목을 target Entity에 복사 (지정된 필드 제외).
     *
     * @param source   Map 형태의 요청 데이터
     * @param target   대상 Entity
     * @param excludes 복사하지 않을 필드명 배열
     * @return target 객체
     * @throws RuntimeException 리플렉션 필드 접근 실패 시
     */
    public static <T> T mapCopy(java.util.Map<String, Object> source, T target, String... excludes) {
        if (source == null || target == null) {
            return target;
        }

        java.util.Set<String> excludeSet = java.util.Arrays.stream(excludes).collect(java.util.stream.Collectors.toSet());
        Class<?> targetClass = target.getClass();

        try {
            for (java.util.Map.Entry<String, Object> entry : source.entrySet()) {
                String fieldName = entry.getKey();

                // 제외 필드 체크
                if (excludeSet.contains(fieldName)) {
                    continue;
                }

                Object value = entry.getValue();

                if (value == null) {
                    continue;
                }

                try {
                    Field targetField = targetClass.getDeclaredField(fieldName);
                    targetField.setAccessible(true);

                    if (targetField.getType().isAssignableFrom(value.getClass())) {
                        targetField.set(target, value);
                    }
                } catch (NoSuchFieldException ignored) {
                    // target에 해당 필드가 없으면 무시
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.mapCopy() 실패: " + e.getMessage(), e);
        }

        return target;
    }

    /**
     * VO/DTO의 필드를 Entity에 복사 (제외 필드를 ^로 구분된 문자열로 지정).
     *
     * <p>excludes 가 null/빈 문자열이면 제외 없이 {@link #voCopy(Object, Object)} 와 동일하게 동작.
     *
     * @param source   원본 VO/DTO
     * @param target   대상 Entity
     * @param excludes 복사하지 않을 필드명 (^로 구분, 예: "id^regBy^regDate")
     * @return target 객체
     */
    public static <T> T voCopyExclude(Object source, T target, String excludes) {
        if (excludes == null || excludes.isEmpty()) {
            return voCopy(source, target);
        }
        String[] excludeArray = excludes.split("\\^");
        return voCopy(source, target, excludeArray);
    }

    /**
     * VO/DTO의 필드를 Entity에 복사 (포함 필드만 지정).
     * 포함 필드에만 포함된 필드만 복사됨.
     *
     * @param source   원본 VO/DTO
     * @param target   대상 Entity
     * <p>includes 가 null/빈 문자열이면 아무것도 복사하지 않고 target 그대로 반환.
     *
     * @param includes 복사할 필드명만 (^로 구분, 예: "memberNm^memberEmail^memberPhone")
     * @return target 객체
     * @throws RuntimeException 리플렉션 필드 접근 실패 시
     */
    public static <T> T voCopyInclude(Object source, T target, String includes) {
        if (source == null || target == null || includes == null || includes.isEmpty()) {
            return target;
        }

        java.util.Set<String> includeSet = java.util.Arrays.stream(includes.split("\\^"))
            .collect(java.util.stream.Collectors.toSet());
        Class<?> sourceClass = source.getClass();
        Class<?> targetClass = target.getClass();

        try {
            for (Field sourceField : sourceClass.getDeclaredFields()) {
                String fieldName = sourceField.getName();

                // 포함 필드 체크 - 포함 목록에 없으면 스킵
                if (!includeSet.contains(fieldName)) {
                    continue;
                }

                sourceField.setAccessible(true);
                Object value = sourceField.get(source);

                if (value == null) {
                    continue;
                }

                try {
                    Field targetField = targetClass.getDeclaredField(fieldName);
                    targetField.setAccessible(true);

                    if (targetField.getType().isAssignableFrom(sourceField.getType())) {
                        targetField.set(target, value);
                    }
                } catch (NoSuchFieldException ignored) {
                    // target에 해당 필드가 없으면 무시
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.voCopyInclude() 실패: " + e.getMessage(), e);
        }

        return target;
    }

    /**
     * VO/DTO의 필드를 Entity에 복사 (제외 필드와 포함 필드 모두 지정).
     * 포함 필드 중에서 제외 필드를 뺀 것만 복사됨.
     *
     * @param source   원본 VO/DTO
     * @param target   대상 Entity
     * <p>최종 복사 대상 = (includes 집합) − (excludes 집합). includes 가 null/빈 문자열이면 무동작.
     * excludes 가 null/빈 문자열이면 제외 없이 includes 전체를 복사.
     *
     * @param includes 복사할 필드명 (^로 구분, 예: "id^memberNm^memberEmail^regBy")
     * @param excludes 제외할 필드명 (^로 구분, 예: "id^regBy^regDate")
     * @return target 객체
     * @throws RuntimeException 리플렉션 필드 접근 실패 시
     */
    public static <T> T voCopyIncludeExclude(Object source, T target, String includes, String excludes) {
        if (source == null || target == null || includes == null || includes.isEmpty()) {
            return target;
        }

        java.util.Set<String> includeSet = java.util.Arrays.stream(includes.split("\\^"))
            .collect(java.util.stream.Collectors.toSet());
        java.util.Set<String> excludeSet = excludes != null && !excludes.isEmpty() ?
            java.util.Arrays.stream(excludes.split("\\^")).collect(java.util.stream.Collectors.toSet()) :
            java.util.Collections.emptySet();

        Class<?> sourceClass = source.getClass();
        Class<?> targetClass = target.getClass();

        try {
            for (Field sourceField : sourceClass.getDeclaredFields()) {
                String fieldName = sourceField.getName();

                // 포함 필드 체크
                if (!includeSet.contains(fieldName)) {
                    continue;
                }

                // 제외 필드 체크
                if (excludeSet.contains(fieldName)) {
                    continue;
                }

                sourceField.setAccessible(true);
                Object value = sourceField.get(source);

                if (value == null) {
                    continue;
                }

                try {
                    Field targetField = targetClass.getDeclaredField(fieldName);
                    targetField.setAccessible(true);

                    if (targetField.getType().isAssignableFrom(sourceField.getType())) {
                        targetField.set(target, value);
                    }
                } catch (NoSuchFieldException ignored) {
                    // target에 해당 필드가 없으면 무시
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.voCopyIncludeExclude() 실패: " + e.getMessage(), e);
        }

        return target;
    }

    /**
     * Map<String, Object>의 항목을 Entity에 복사 (제외 필드를 ^로 구분된 문자열로 지정).
     *
     * @param source   Map 형태의 요청 데이터
     * @param target   대상 Entity
     * <p>excludes 가 null/빈 문자열이면 제외 없이 {@link #mapCopy(java.util.Map, Object)} 와 동일 동작.
     *
     * @param excludes 복사하지 않을 필드명 (^로 구분, 예: "id^regBy^regDate")
     * @return target 객체
     */
    public static <T> T mapCopyExclude(java.util.Map<String, Object> source, T target, String excludes) {
        if (excludes == null || excludes.isEmpty()) {
            return mapCopy(source, target);
        }
        String[] excludeArray = excludes.split("\\^");
        return mapCopy(source, target, excludeArray);
    }

    /**
     * Map<String, Object>의 항목을 Entity에 복사 (포함 필드만 지정).
     *
     * @param source   Map 형태의 요청 데이터
     * @param target   대상 Entity
     * <p>includes 가 null/빈 문자열이면 아무것도 복사하지 않고 target 그대로 반환.
     *
     * @param includes 복사할 필드명만 (^로 구분, 예: "siteId^memberNm^memberEmail")
     * @return target 객체
     * @throws RuntimeException 리플렉션 필드 접근 실패 시
     */
    public static <T> T mapCopyInclude(java.util.Map<String, Object> source, T target, String includes) {
        if (source == null || target == null || includes == null || includes.isEmpty()) {
            return target;
        }

        java.util.Set<String> includeSet = java.util.Arrays.stream(includes.split("\\^"))
            .collect(java.util.stream.Collectors.toSet());
        Class<?> targetClass = target.getClass();

        try {
            for (java.util.Map.Entry<String, Object> entry : source.entrySet()) {
                String fieldName = entry.getKey();

                if (!includeSet.contains(fieldName)) {
                    continue;
                }

                Object value = entry.getValue();

                if (value == null) {
                    continue;
                }

                try {
                    Field targetField = targetClass.getDeclaredField(fieldName);
                    targetField.setAccessible(true);

                    if (targetField.getType().isAssignableFrom(value.getClass())) {
                        targetField.set(target, value);
                    }
                } catch (NoSuchFieldException ignored) {
                    // target에 해당 필드가 없으면 무시
                }
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.mapCopyInclude() 실패: " + e.getMessage(), e);
        }

        return target;
    }

    /**
     * VO/DTO 의 모든 필드(상속 포함)를 Map<String, Object> 로 변환.
     *
     * 용도: MyBatis Mapper 가 Map 을 받도록 하면, Mapper XML 의 <if test="someField != null">
     *       조건이 DTO 에 정의되지 않은 필드를 참조해도 OGNL 이 missing key 를 null 로 안전 처리한다.
     *
     * 특징:
     * - source 의 부모 클래스 필드도 모두 포함 (BaseRequest 의 searchType/searchValue 등)
     * - null 값도 그대로 Map 에 포함 (MyBatis <if> 평가에 필요)
     * - 타입 정보 보존 (Integer 는 Integer, String 은 String) — JDBC 타입 추론 유지
     *
     * <p>static 필드는 제외한다. 상속 체인을 자식→부모 순으로 순회하며,
     * 동일 이름 필드는 먼저 담긴 자식 클래스 값이 우선(containsKey 가드).
     *
     * @param source 변환할 VO/DTO 객체 (null 이면 빈 Map 반환)
     * @return source 의 모든 필드를 담은 LinkedHashMap (순서 보존)
     * @throws RuntimeException 리플렉션 필드 접근 실패 시 (IllegalAccessException 래핑)
     */
    public static Map<String, Object> voToMap(Object source) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (source == null) return result;

        try {
            Class<?> clazz = source.getClass();
            while (clazz != null && clazz != Object.class) {
                for (Field field : clazz.getDeclaredFields()) {
                    if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) continue;
                    field.setAccessible(true);
                    String name = field.getName();
                    // 상속 체인에서 동일 이름 필드는 자식 클래스 값 우선 (이미 putIfAbsent 효과)
                    if (!result.containsKey(name)) {
                        result.put(name, field.get(source));
                    }
                }
                clazz = clazz.getSuperclass();
            }
        } catch (IllegalAccessException e) {
            throw new RuntimeException("VoUtil.voToMap() 실패: " + e.getMessage(), e);
        }
        return result;
    }
}
