package com.shopjoy.ecadminapi.common.util;

import java.lang.reflect.Field;

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
 */
public class VoUtil {

    private VoUtil() {}

    /**
     * source 객체의 non-null 필드를 target 객체에 복사.
     *
     * @param source 원본 VO/DTO (요청 데이터)
     * @param target 대상 Entity (DB 엔티티)
     * @return target 객체 (원본 수정 후 반환)
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
     * @param source Map 형태의 요청 데이터
     * @param target 대상 Entity
     * @return target 객체
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
     * @param includes 복사할 필드명만 (^로 구분, 예: "memberNm^memberEmail^memberPhone")
     * @return target 객체
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
     * @param includes 복사할 필드명 (^로 구분, 예: "id^memberNm^memberEmail^regBy")
     * @param excludes 제외할 필드명 (^로 구분, 예: "id^regBy^regDate")
     * @return target 객체
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
     * @param includes 복사할 필드명만 (^로 구분, 예: "siteId^memberNm^memberEmail")
     * @return target 객체
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
}
