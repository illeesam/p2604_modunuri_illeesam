package com.shopjoy.ecadminapi.common.aop;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * AOP 로그용 객체 포맷 공통 유틸.
 *
 * <p>MvcLogAspect 와 RepositoryResultLogAspect 가 공유한다.
 * Entity/DTO 의 기본 {@code Object.toString()} 결과 (예: {@code Foo@5bc93e1f}) 대신
 * 선언 필드를 reflection 으로 덤프해 {@code Foo{a='x', b=1}} 형태로 출력한다.</p>
 *
 * <p>스칼라 타입(String/Number/Boolean/temporal/enum) 은 reflection 우회.
 * JDK 모듈 제약으로 String 등의 내부 필드 접근이 실패해 {@code String@hex} 폴백되는 문제를 회피한다.</p>
 */
public final class AopFormatUtil {

    private AopFormatUtil() {}

    /**
     * 객체를 사람이 읽을 수 있는 문자열로 포맷한다.
     *
     * @param obj 대상 (null 허용)
     * @return null → "null", 스칼라 → 값, DTO/Entity → {@code SimpleName{field1=v1, field2=v2}}
     */
    public static String formatObject(Object obj) {
        if (obj == null) return "null";

        /* 1) 스칼라 — reflection 없이 값 직접 */
        if (obj instanceof String || obj instanceof Character) return "'" + obj + "'";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof java.time.LocalDateTime ||
            obj instanceof java.time.LocalDate ||
            obj instanceof java.time.LocalTime ||
            obj instanceof java.util.Date) return "'" + obj + "'";
        if (obj instanceof Enum<?>) return obj.toString();

        /* 2) Collection / Map / 배열 — 건수 요약 (무한 재귀 회피) */
        if (obj instanceof Collection<?> c) {
            if (c.isEmpty()) return "[]";
            // 작은 컬렉션은 펼침 (3개 이하)
            if (c.size() <= 3) {
                StringBuilder sb = new StringBuilder("[");
                boolean first = true;
                for (Object item : c) {
                    if (!first) sb.append(", ");
                    sb.append(formatObject(item));
                    first = false;
                }
                return sb.append("]").toString();
            }
            return "[" + c.size() + " items]";
        }
        if (obj instanceof Map<?, ?> m) {
            if (m.isEmpty()) return "{}";
            if (m.size() <= 5) {
                StringBuilder sb = new StringBuilder("{");
                boolean first = true;
                for (Map.Entry<?, ?> e : m.entrySet()) {
                    if (!first) sb.append(", ");
                    sb.append(e.getKey()).append("=").append(formatObject(e.getValue()));
                    first = false;
                }
                return sb.append("}").toString();
            }
            return "{" + m.size() + " entries}";
        }
        if (obj.getClass().isArray()) {
            // 원시 배열·Object 배열 모두 지원
            int len = java.lang.reflect.Array.getLength(obj);
            if (len == 0) return "[]";
            if (len <= 3) {
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < len; i++) {
                    if (i > 0) sb.append(", ");
                    sb.append(formatObject(java.lang.reflect.Array.get(obj, i)));
                }
                return sb.append("]").toString();
            }
            return "[" + len + " items]";
        }

        /* 3) DTO/Entity — 상속 체인 필드 reflection 덤프 */
        try {
            Class<?> clazz = obj.getClass();
            // CGLIB/JDK 프록시면 한 단계 위 클래스 사용
            if (clazz.getName().contains("$$")) {
                Class<?> sc = clazz.getSuperclass();
                if (sc != null && sc != Object.class) clazz = sc;
            }
            StringBuilder sb = new StringBuilder(clazz.getSimpleName()).append("{");
            boolean first = true;
            List<Class<?>> chain = new ArrayList<>();
            for (Class<?> c = clazz; c != null && c != Object.class; c = c.getSuperclass()) chain.add(0, c);
            for (Class<?> c : chain) {
                for (Field field : c.getDeclaredFields()) {
                    if (Modifier.isStatic(field.getModifiers()) ||
                        Modifier.isTransient(field.getModifiers()) ||
                        field.getName().startsWith("$") ||
                        field.getName().contains("logger") ||
                        field.getName().contains("CACHE")) continue;

                    field.setAccessible(true);
                    Object value = field.get(obj);
                    if (!first) sb.append(", ");
                    sb.append(field.getName()).append("=");
                    if (value == null) {
                        sb.append("null");
                    } else if (value instanceof String || value instanceof Character ||
                               value instanceof java.time.LocalDateTime ||
                               value instanceof java.time.LocalDate ||
                               value instanceof java.time.LocalTime ||
                               value instanceof java.util.Date) {
                        sb.append("'").append(value).append("'");
                    } else if (value instanceof Collection<?> col) {
                        sb.append("[").append(col.size()).append(" items]");
                    } else if (value instanceof Map<?, ?> mp) {
                        sb.append("{").append(mp.size()).append(" entries}");
                    } else if (value instanceof Number || value instanceof Boolean || value instanceof Enum<?>) {
                        sb.append(value);
                    } else {
                        // 중첩 객체 — 한 단계 더 펼침 (재귀 제한)
                        sb.append(value);
                    }
                    first = false;
                }
            }
            return sb.append("}").toString();
        } catch (Exception e) {
            return obj.getClass().getSimpleName() + "@" + Integer.toHexString(obj.hashCode());
        }
    }
}
