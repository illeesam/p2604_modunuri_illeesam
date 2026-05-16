package com.shopjoy.ecadminapi.common.config;

import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.*;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MyBatis INSERT/UPDATE 시 공통 메타데이터(site_id + 감사컬럼)를 서버에서 강제 주입하는 인터셉터.
 *
 * JPA 경로는 {@code EntitySaveListener} 가 처리하나 MyBatis(mapper insert/update)는
 * 리스너를 타지 않으므로 동일 정책(sy.57 §3.1)을 여기서 보강한다.
 *
 * 처리:
 *  - INSERT : siteId 덮어쓰기 + regBy/regDate/updBy/updDate 주입
 *  - UPDATE : siteId 덮어쓰기 + updBy/updDate 주입 (reg* 보존)
 *
 * 대상 필드는 리플렉션으로 존재할 때만 세팅한다(필드 없으면 skip). BaseEntity 상속
 * 여부와 무관하게 표준 필드명(siteId/regBy/regDate/updBy/updDate)을 가진 객체에 적용된다.
 * 비표준 감사 네이밍(rgtr/mdfr 등 — 예: ZzSamy*)은 대상 필드명이 다르므로 자연히 제외된다.
 *
 * 파라미터 형태별 처리:
 *  - 단일 엔티티 객체
 *  - @Param 래핑 Map (내부 값 객체들 순회)
 *  - Collection/배열 (saveList/saveAll — 각 원소)
 *
 * 미인증/시스템/배치 컨텍스트(authId·siteId 빈 값)에서는 *_by / site_id 를 덮어쓰지 않고
 * 기존 값을 보존한다. 날짜는 항상 서버 시각으로 세팅한다.
 */
@Slf4j
@Intercepts({
    // Executor.update(MappedStatement, parameter) — INSERT/UPDATE/DELETE 가 모두 거치는 단일 시그니처.
    // SELECT(query)는 메타 주입 대상이 아니므로 인터셉트하지 않음.
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class MyBatisSaveMetaInterceptor implements Interceptor {

    /** 클래스별 표준 메타 필드 캐시 (fieldName -&gt; Field, 미존재 시 {@link #NONE} 마커 저장 → 반복 리플렉션 회피) */
    private static final ConcurrentHashMap<Class<?>, Map<String, Field>> CACHE = new ConcurrentHashMap<>();
    /** 필드 부재를 캐시에 표현하기 위한 센티넬 Field(자기 자신의 NONE 필드를 참조). null 과 구분하기 위함. */
    private static final Field NONE;
    static {
        try {
            NONE = MyBatisSaveMetaInterceptor.class.getDeclaredField("NONE");
        } catch (NoSuchFieldException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    /**
     * update(=INSERT/UPDATE/DELETE) 실행 직전 파라미터에 메타데이터를 주입한다.
     *
     * @param invocation 침입 컨텍스트. args[0]={@link MappedStatement}, args[1]=파라미터
     * @return 원본 실행 결과 그대로(주입은 파라미터 객체 가변 변경으로 수행되며 결과는 변형 안 함)
     * @throws Throwable 원본 실행 예외 그대로 전파. INSERT/UPDATE 외(DELETE 등)는 주입 없이 통과
     */
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object param        = invocation.getArgs()[1];
        SqlCommandType type = ms.getSqlCommandType();

        if (type == SqlCommandType.INSERT || type == SqlCommandType.UPDATE) {
            applyToParam(param, type == SqlCommandType.INSERT);
        }
        return invocation.proceed();
    }

    /**
     * 파라미터 형태(Map/Collection/배열/단일 객체)를 재귀적으로 분해해 각 도메인 객체에 메타를 주입한다.
     *
     * @param param    대상 파라미터(null·자바 표준 타입·primitive 는 주입 대상 아님 → skip)
     * @param isInsert INSERT 면 true(reg*+upd* 주입), UPDATE 면 false(upd* 만 주입)
     */
    private void applyToParam(Object param, boolean isInsert) {
        if (param == null) return;

        if (param instanceof Map<?, ?> map) {                 // @Param 래핑
            for (Object v : map.values()) applyToParam(v, isInsert);
            return;
        }
        if (param instanceof Collection<?> col) {             // saveList
            for (Object v : col) applyToParam(v, isInsert);
            return;
        }
        if (param.getClass().isArray()) {
            for (Object v : (Object[]) param) applyToParam(v, isInsert);
            return;
        }
        // 단순 타입은 대상 아님
        Class<?> c = param.getClass();
        if (c.getName().startsWith("java.") || c.isPrimitive()) return;

        injectMeta(param, isInsert);
    }

    /**
     * 단일 객체에 표준 메타 필드를 리플렉션으로 주입한다(필드 존재 시에만).
     *
     * <p>siteId·authId 가 빈 값(미인증/시스템/배치 컨텍스트)이면 해당 필드는 덮어쓰지 않고
     * 기존 값을 보존한다. 날짜는 항상 서버 현재 시각으로 세팅한다.</p>
     *
     * @param obj      대상 도메인 객체
     * @param isInsert true면 regBy/regDate/updBy/updDate 모두, false면 updBy/updDate 만 주입
     */
    private void injectMeta(Object obj, boolean isInsert) {
        Map<String, Field> fields = fieldsOf(obj.getClass());

        String siteId = SecurityUtil.getSiteId();
        if (siteId != null && !siteId.isEmpty()) {
            setIfPresent(obj, fields, "siteId", siteId);
        }

        String authId = currentAuthId();
        LocalDateTime now = LocalDateTime.now();

        if (isInsert) {
            if (authId != null) {
                setIfPresent(obj, fields, "regBy", authId);
                setIfPresent(obj, fields, "updBy", authId);
            }
            setDateIfPresent(obj, fields, "regDate", now);
            setDateIfPresent(obj, fields, "updDate", now);
        } else {
            if (authId != null) setIfPresent(obj, fields, "updBy", authId);
            setDateIfPresent(obj, fields, "updDate", now);
        }
    }

    /**
     * String 타입 메타 필드를 안전하게 세팅한다.
     *
     * @param obj    대상 객체
     * @param fields 캐시된 필드맵
     * @param name   필드명(siteId/regBy/updBy 등)
     * @param val    설정할 값
     *               필드 부재({@link #NONE}) 또는 타입이 String 이 아니면 무시(안전 skip).
     *               IllegalAccessException 은 흡수(주입 실패가 비즈니스 흐름을 끊지 않도록)
     */
    private void setIfPresent(Object obj, Map<String, Field> fields, String name, String val) {
        Field f = fields.get(name);
        if (f == null || f == NONE || f.getType() != String.class) return;
        try { f.set(obj, val); } catch (IllegalAccessException ignored) {}
    }

    /** 날짜 필드는 LocalDateTime / LocalDate 둘 다 대응 */
    private void setDateIfPresent(Object obj, Map<String, Field> fields, String name, LocalDateTime now) {
        Field f = fields.get(name);
        if (f == null || f == NONE) return;
        try {
            if (f.getType() == LocalDateTime.class)      f.set(obj, now);
            else if (f.getType() == LocalDate.class)     f.set(obj, now.toLocalDate());
        } catch (IllegalAccessException ignored) {}
    }

    /** 클래스 계층에서 표준 메타 필드를 찾아 캐시 */
    private Map<String, Field> fieldsOf(Class<?> type) {
        return CACHE.computeIfAbsent(type, t -> {
            Map<String, Field> m = new ConcurrentHashMap<>();
            for (String name : new String[]{"siteId", "regBy", "regDate", "updBy", "updDate"}) {
                Field found = NONE;
                for (Class<?> c = t; c != null && c != Object.class; c = c.getSuperclass()) {
                    try {
                        Field f = c.getDeclaredField(name);
                        f.setAccessible(true);
                        found = f;
                        break;
                    } catch (NoSuchFieldException ignored) {
                        // 상위 클래스 계속 탐색
                    }
                }
                m.put(name, found);
            }
            return m;
        });
    }

    /**
     * 현재 인증 사용자 ID 를 조회한다.
     *
     * @return SecurityContext 의 authId. null/빈 문자열이면 null 반환(미인증·시스템·배치
     *         컨텍스트로 간주 → 호출부에서 *_by 필드를 덮어쓰지 않고 기존 값 보존)
     */
    private String currentAuthId() {
        String id = SecurityUtil.getAuthUser().authId();
        return (id == null || id.isEmpty()) ? null : id;
    }

    /**
     * 인터셉터를 대상에 적용한다.
     *
     * @param target 래핑 대상(Executor 등)
     * @return @Signature 매칭 시 프록시 래핑 객체, 아니면 원본(불필요한 프록시 방지)
     */
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    /**
     * 인터셉터 프로퍼티 주입 콜백. 외부 설정이 없어 빈 구현이다.
     *
     * @param properties MyBatis 설정 프로퍼티(미사용)
     */
    @Override
    public void setProperties(Properties properties) {}
}
