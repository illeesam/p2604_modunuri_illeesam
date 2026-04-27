package com.shopjoy.ecadminapi.common.util;

import java.lang.reflect.Field;

/**
 * VO/DTO → Entity 필드 자동 복사 유틸.
 *
 * 용도:
 * 1. Request Body(VO/DTO)의 필드를 Entity로 자동 복사
 * 2. null 값은 복사하지 않음 (선택적 수정만 반영)
 * 3. 타입 검증으로 잘못된 필드 주입 방지
 *
 * 예시:
 *   MbMember entity = repository.findById(id).orElseThrow(...);
 *   MbMemberVo vo = (MbMemberVo) body;
 *   VoUtil.voCopy(vo, entity);  // null이 아닌 필드만 복사
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
}
