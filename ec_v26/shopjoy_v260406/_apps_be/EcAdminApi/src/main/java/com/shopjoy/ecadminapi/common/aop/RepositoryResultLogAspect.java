package com.shopjoy.ecadminapi.common.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Collection;
import java.util.List;

/**
 * Repository 메서드 실행 결과를 자동으로 로깅하는 AOP Aspect.
 * local/dev profile에서만 출력 (prod 제외).
 */
@Aspect
@Component
public class RepositoryResultLogAspect {
    private static final Logger log = LoggerFactory.getLogger(RepositoryResultLogAspect.class);

    @Autowired
    private Environment environment;

    /**
     * Repository 메서드 실행 결과를 가로채 상세 로깅한다.
     *
     * <p>포인트컷 {@code com.shopjoy.ecadminapi.*.*.repository.*Repository.*}: 도메인 2단계 하위
     * (예: bo.mb) repository 패키지의 {@code *Repository} public 메서드만 대상으로 한정한다
     * (MvcLogAspect 보다 좁은 범위 — 결과 본문 상세 덤프 전용).</p>
     *
     * <p>save/delete 로 시작하는 메서드는 변경 작업 로그({@link #logSaveDeleteResult})로,
     * 그 외 조회는 결과 목록 미리보기 로그({@link #logResult})로 분기한다.</p>
     *
     * @param joinPoint 가로챈 조인포인트(인자·시그니처·타깃 보유)
     * @return 원본 메서드 반환값 그대로 전달
     * @throws Throwable 원본 예외는 ERROR 로그 후 재전파(로깅이 예외를 삼키지 않음).
     *                   로깅 비활성(prod 등) 시에도 호출자 정보 등 부가 연산을 건너뛰어 오버헤드 최소화
     */
    @Around("execution(public * com.shopjoy.ecadminapi.*.*.repository.*Repository.*(..))")
    public Object logRepositoryResult(ProceedingJoinPoint joinPoint) throws Throwable {
        boolean loggingEnabled = isLoggingEnabled();

        String methodName = joinPoint.getSignature().getName();
        String simpleClassName = getRepositorySimpleName(joinPoint);
        String fullClassName   = getRepositoryClassName(joinPoint);
        String callerInfo = loggingEnabled ? getCallerInfo() : null;
        Object[] args = joinPoint.getArgs();

        boolean isSaveDelete = methodName.startsWith("save") || methodName.startsWith("delete");

        // 1단계: proceed() 전에 헤더 박스 출력 → 그 사이에 실제 SQL 로그가 끼어든다.
        if (loggingEnabled) {
            if (isSaveDelete) {
                logSaveDeleteHeader(simpleClassName, fullClassName, methodName, callerInfo, args);
            } else {
                logResultHeader(simpleClassName, fullClassName, methodName, callerInfo, args);
            }
        }

        try {
            Object result = joinPoint.proceed();

            // 2단계: proceed() 후에 결과 박스 출력 (=== 닫힘선으로 종료).
            if (loggingEnabled) {
                if (isSaveDelete) {
                    logSaveDeleteResult(methodName, result);
                } else {
                    logResult(result);
                }
            }

            return result;
        } catch (Exception e) {
            log.error("[{}:{}] ERROR: {}", simpleClassName, methodName, e.getMessage());
            throw e;
        }
    }

    /**
     * 로깅 활성화 여부 확인.
     *
     * @return 활성 프로파일 첫 항목이 local/dev 이면 true. 비어 있으면 false(운영 안전 측).
     *         다중 프로파일 시 첫 번째만 판정함에 유의
     */
    private boolean isLoggingEnabled() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) return false;
        String p = activeProfiles[0];
        return "local".equalsIgnoreCase(p) || "dev".equalsIgnoreCase(p);
    }

    /**
     * 프록시 영향을 배제한 Repository 인터페이스 단순명을 반환한다.
     *
     * @param joinPoint 조인포인트
     * @return 타깃 클래스 단순명. CGLIB/JDK 프록시('$' 또는 'Enhancer' 포함)면
     *         선언 인터페이스 단순명으로 대체(로그 가독성 확보)
     */
    private String getRepositorySimpleName(ProceedingJoinPoint joinPoint) {
        String name = joinPoint.getTarget().getClass().getSimpleName();
        if (name.contains("$") || name.contains("Enhancer")) {
            return joinPoint.getSignature().getDeclaringType().getSimpleName();
        }
        return name;
    }

    /**
     * 프록시 영향을 배제한 Repository 인터페이스 FQCN 을 반환한다.
     *
     * @param joinPoint 조인포인트
     * @return 타깃이 구현한 첫 번째 인터페이스의 FQCN. 인터페이스가 없거나 조회 실패 시
     *         선언 타입 FQCN 으로 폴백(예외는 흡수)
     */
    private String getRepositoryClassName(ProceedingJoinPoint joinPoint) {
        try {
            Class<?>[] interfaces = joinPoint.getTarget().getClass().getInterfaces();
            if (interfaces.length > 0) return interfaces[0].getName();
        } catch (Exception ignored) {}
        return joinPoint.getSignature().getDeclaringType().getName();
    }

    /**
     * 현재 스레드 스택에서 Repository 를 호출한 Service/Controller 위치를 찾아 반환한다.
     *
     * @return {@code com.shopjoy} 패키지이면서 이름에 Service 또는 Controller 가 포함된
     *         첫 스택 프레임을 {@code 클래스단순명.메서드명} 으로. 없으면 "Unknown"
     *         (호출 출처 추적용 — 어느 서비스가 이 쿼리를 유발했는지 식별)
     */
    private String getCallerInfo() {
        for (StackTraceElement e : Thread.currentThread().getStackTrace()) {
            String cn = e.getClassName();
            if (cn.startsWith("com.shopjoy") &&
                (cn.contains("Service") || cn.contains("Controller"))) {
                return cn.substring(cn.lastIndexOf('.') + 1) + "." + e.getMethodName();
            }
        }
        return "Unknown";
    }

    /**
     * 조회 메서드 결과를 박스 형태로 DEBUG 로깅한다.
     *
     * <p>Optional 은 존재 여부 표기, List/Collection 은 상위 3건만 미리보기 후 총 건수 표기,
     * 단일 객체는 필드 덤프. 빈 컬렉션은 "NO DATA" 로 명시한다(쿼리 결과 0건 즉시 식별).</p>
     *
     * @param simpleClassName Repository 단순명
     * @param fullClassName   Repository FQCN
     * @param methodName      메서드명
     * @param callerInfo      호출 출처(Service/Controller)
     * @param args            메서드 인자(있으면 Parameters 라인 출력)
     * @param result          반환값(null 허용)
     */
    private void logResultHeader(String simpleClassName, String fullClassName, String methodName,
                                 String callerInfo, Object[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n").append("▶▶▶ ").append("=".repeat(65)).append("\n");
        sb.append("   Called From: ").append(callerInfo).append("\n");
        sb.append("   Interface: ").append(fullClassName).append(" ").append(simpleClassName)
          .append(".").append(methodName).append("()");
        if (args.length > 0) {
            sb.append("\n   Parameters: ").append(formatParameters(args));
        }
        log.debug("{}", sb);
    }

    /**
     * 조회 메서드 결과를 박스 형태로 DEBUG 로깅한다. ({@link #logResultHeader} 와 짝)
     *
     * <p>{@code proceed()} 후 호출되어, 헤더 박스와 그 사이에 출력된 실제 SQL 로그
     * 다음에 결과를 이어 붙이고 {@code ===} 닫힘선으로 종료한다.</p>
     *
     * <p>Optional 은 존재 여부 표기, List/Collection 은 상위 3건만 미리보기 후 총 건수 표기,
     * 단일 객체는 필드 덤프. 빈 컬렉션은 "NO DATA" 로 명시한다(쿼리 결과 0건 즉시 식별).</p>
     *
     * @param result 반환값(null 허용)
     */
    private void logResult(Object result) {
        StringBuilder sb = new StringBuilder("\n");

        if (result == null) {
            sb.append("Result: null\n");
        } else if (result instanceof java.util.Optional<?> optional) {
            sb.append("Result: ").append(optional.isPresent() ? formatObject(optional.get()) : "Optional.empty").append("\n");
        } else if (result instanceof List<?> list) {
            if (list.isEmpty()) {
                sb.append("NO DATA\n");
            } else {
                int preview = Math.min(3, list.size());
                for (int i = 0; i < preview; i++) {
                    sb.append("[").append(i + 1).append("] ").append(formatObject(list.get(i))).append("\n");
                }
                sb.append("-".repeat(70)).append("\n");
                sb.append("Total: ").append(list.size()).append(" rows\n");
            }
        } else if (result instanceof Collection<?> col) {
            if (col.isEmpty()) {
                sb.append("NO DATA\n");
            } else {
                int idx = 1;
                for (Object obj : col) {
                    if (idx > 3) break;
                    sb.append("[").append(idx++).append("] ").append(formatObject(obj)).append("\n");
                }
                sb.append("-".repeat(70)).append("\n");
                sb.append("Total: ").append(col.size()).append(" rows\n");
            }
        } else {
            sb.append("Result: ").append(formatObject(result)).append("\n");
        }

        sb.append("=".repeat(70));
        log.debug("{}", sb);
    }

    /**
     * save/delete 변경 메서드의 입력 엔티티와 결과를 박스 형태로 DEBUG 로깅한다.
     *
     * <p>save* 는 INSERT/UPDATE, delete* 는 DELETE 로 표기한다. delete 인자가
     * Collection 이면 건수만, 단건이면 엔티티 필드를 덤프한다.</p>
     *
     * @param simpleClassName Repository 단순명
     * @param fullClassName   Repository FQCN
     * @param methodName      메서드명(save/delete 접두 판별 기준)
     * @param callerInfo      호출 출처
     * @param args            메서드 인자(args[0] 을 대상 엔티티/컬렉션으로 간주)
     * @param result          반환값(null 허용)
     */
    private void logSaveDeleteHeader(String simpleClassName, String fullClassName, String methodName,
                                     String callerInfo, Object[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n").append("▶▶▶ ").append("=".repeat(65)).append("\n");
        sb.append("   Called From: ").append(callerInfo).append("\n");
        sb.append("   Interface: ").append(fullClassName).append(" ").append(simpleClassName)
          .append(".").append(methodName).append("()");

        if (args.length > 0) {
            if (methodName.startsWith("save")) {
                sb.append("\n   Operation: INSERT/UPDATE");
                sb.append("\n   Entity: ").append(formatObject(args[0]));
            } else if (methodName.startsWith("delete")) {
                sb.append("\n   Operation: DELETE");
                if (args[0] instanceof Collection<?> c) {
                    sb.append("\n   Entities: ").append(args[0].getClass().getSimpleName())
                      .append(" (count: ").append(c.size()).append(")");
                } else {
                    sb.append("\n   Entity: ").append(formatObject(args[0]));
                }
            }
        }
        log.debug("{}", sb);
    }

    /**
     * save/delete 변경 메서드의 결과를 박스 형태로 DEBUG 로깅한다. ({@link #logSaveDeleteHeader} 와 짝)
     *
     * <p>{@code proceed()} 후 호출되어, 헤더 박스와 그 사이에 출력된 실제 SQL 로그
     * 다음에 결과를 이어 붙이고 {@code ===} 닫힘선으로 종료한다.</p>
     *
     * @param methodName 메서드명(현재 분기 없음 — 시그니처 일관성 유지용)
     * @param result     반환값(null 허용)
     */
    private void logSaveDeleteResult(String methodName, Object result) {
        StringBuilder sb = new StringBuilder("\n");
        sb.append("Result: ").append(result != null ? formatObject(result) : "null").append("\n");
        sb.append("=".repeat(70));
        log.debug("{}", sb);
    }

    /**
     * 인자 배열을 {@code [v1, v2, ...]} 형태 문자열로 포맷한다.
     *
     * @param args 인자 배열(널/빈 배열이면 빈 문자열)
     * @return 각 인자를 {@link #formatParameterValue} 로 변환해 쉼표 결합한 대괄호 표현
     */
    private String formatParameters(Object[] args) {
        if (args == null || args.length == 0) return "";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(formatParameterValue(args[i]));
        }
        return sb.append("]").toString();
    }

    /**
     * 단일 인자 값을 타입별 간략 표기로 변환한다.
     *
     * @param obj 인자 값
     * @return null→"null", String→따옴표 감쌈, Number/Boolean→그대로, Map→"{...}",
     *         Collection→"[n items]", 그 외→{@code SimpleName@hex}
     *         (대용량 객체 toString 폭주 방지를 위한 의도적 축약)
     */
    private String formatParameterValue(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "'" + obj + "'";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof java.util.Map) return "{...}";
        if (obj instanceof Collection<?> c) return "[" + c.size() + " items]";
        return obj.getClass().getSimpleName() + "@" + Integer.toHexString(obj.hashCode());
    }

    /**
     * 객체의 선언 필드를 리플렉션으로 순회해 {@code Class{f1=v1, f2=v2}} 형태로 덤프한다.
     *
     * <p>static/transient/이름에 'logger' 포함 필드는 제외한다(직렬화 불필요·노이즈 회피).
     * 문자열·날짜 타입 값은 따옴표로 감싼다.</p>
     *
     * @param obj 대상 객체(null 이면 "null")
     * @return 필드 덤프 문자열. 리플렉션 실패 시 {@code SimpleName@hex} 폴백(예외 흡수)
     */
    private String formatObject(Object obj) {
        if (obj == null) return "null";
        try {
            Class<?> clazz = obj.getClass();
            StringBuilder sb = new StringBuilder(clazz.getSimpleName()).append("{");
            boolean first = true;
            for (Field field : clazz.getDeclaredFields()) {
                if (java.lang.reflect.Modifier.isStatic(field.getModifiers()) ||
                    java.lang.reflect.Modifier.isTransient(field.getModifiers()) ||
                    field.getName().contains("logger")) continue;

                field.setAccessible(true);
                Object value = field.get(obj);
                if (!first) sb.append(", ");
                sb.append(field.getName()).append("=");
                if (value == null) {
                    sb.append("null");
                } else if (value instanceof String ||
                           value instanceof java.time.LocalDateTime ||
                           value instanceof java.time.LocalDate ||
                           value instanceof java.time.LocalTime) {
                    sb.append("'").append(value).append("'");
                } else {
                    sb.append(value);
                }
                first = false;
            }
            return sb.append("}").toString();
        } catch (Exception e) {
            return obj.getClass().getSimpleName() + "@" + Integer.toHexString(obj.hashCode());
        }
    }
}
