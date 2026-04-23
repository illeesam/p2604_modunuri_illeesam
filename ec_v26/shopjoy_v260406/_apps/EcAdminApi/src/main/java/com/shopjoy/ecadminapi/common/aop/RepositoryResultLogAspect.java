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
 * Repository 메서드 실행 결과를 자동으로 console에 출력하는 AOP Aspect
 * - 모든 Repository find/get 메서드 결과 로깅
 * - local/dev profile에서만 출력 (prod 제외)
 */
@Aspect
@Component
public class RepositoryResultLogAspect {
    private static final Logger log = LoggerFactory.getLogger(RepositoryResultLogAspect.class);

    @Autowired
    private Environment environment;

    /**
     * 모든 Repository 메서드 실행 후 결과 로깅
     * 대상: 모든 public 메서드
     * local/dev profile에서만 출력
     */
    @Around("execution(public * com.shopjoy.ecadminapi.*.*.repository.*Repository.*(..))")
    public Object logRepositoryResult(ProceedingJoinPoint joinPoint) throws Throwable {
        // local/dev profile일 때만 로깅
        boolean isLoggingEnabled = isLoggingEnabled();

        String methodName = joinPoint.getSignature().getName();
        String simpleClassName = joinPoint.getTarget().getClass().getSimpleName();
        String fullClassName = getRepositoryClassName(joinPoint);
        String callerInfo = isLoggingEnabled ? getCallerInfo() : null;
        Object[] args = joinPoint.getArgs();

        try {
            Object result = joinPoint.proceed();

            // local/dev 환경에서만 결과 로깅
            if (isLoggingEnabled) {
                if (methodName.startsWith("save") || methodName.startsWith("delete")) {
                    logSaveDeleteResult(simpleClassName, fullClassName, methodName, callerInfo, args, result);
                } else {
                    logResult(simpleClassName, fullClassName, methodName, callerInfo, args, result);
                }
            }

            return result;
        } catch (Exception e) {
            log.error("[{}:{}] ERROR: {}", simpleClassName, methodName, e.getMessage());
            throw e;
        }
    }

    /**
     * 로깅 활성화 여부 확인 (local/dev profile일 때만)
     */
    private boolean isLoggingEnabled() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) {
            return false;
        }
        String activeProfile = activeProfiles[0];
        return "local".equalsIgnoreCase(activeProfile) || "dev".equalsIgnoreCase(activeProfile);
    }

    /**
     * Proxy 객체에서 실제 Repository 클래스명 추출
     */
    private String getRepositoryClassName(ProceedingJoinPoint joinPoint) {
        try {
            Class<?>[] interfaces = joinPoint.getTarget().getClass().getInterfaces();
            if (interfaces.length > 0) {
                return interfaces[0].getName();
            }
        } catch (Exception e) {
            // ignore
        }
        return joinPoint.getTarget().getClass().getName();
    }

    /**
     * 호출자 정보 추출 (Service/Controller 클래스명 + 메서드명)
     */
    private String getCallerInfo() {
        StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();
        for (StackTraceElement element : stackTrace) {
            String className = element.getClassName();
            if ((className.contains("Service") || className.contains("Controller")) &&
                className.startsWith("com.shopjoy")) {
                return className.substring(className.lastIndexOf(".") + 1) + "." + element.getMethodName();
            }
        }
        return "Unknown";
    }

    /**
     * 결과 데이터를 console에 출력 (최대 3개 행 + 총 행수)
     */
    private void logResult(String simpleClassName, String fullClassName, String methodName, String callerInfo, Object[] args, Object result) {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("   Called From: " + callerInfo);
        System.out.println("   Interface: " + fullClassName + " " + simpleClassName + "." + methodName + "()");
        if (args.length > 0) {
            System.out.println("   Parameters: " + formatParameters(args));
        }
        System.out.println("=".repeat(70));

        if (result == null) {
            System.out.println("Result: null");
        } else if (result instanceof java.util.Optional) {
            java.util.Optional<?> optional = (java.util.Optional<?>) result;
            if (optional.isPresent()) {
                System.out.println("Result: " + formatObject(optional.get()));
            } else {
                System.out.println("Result: Optional.empty");
            }
        } else if (result instanceof List<?>) {
            List<?> list = (List<?>) result;

            if (list.isEmpty()) {
                System.out.println("NO DATA");
            } else {
                int displayCount = Math.min(3, list.size());
                for (int i = 0; i < displayCount; i++) {
                    System.out.println("[" + (i + 1) + "] " + formatObject(list.get(i)));
                }
                System.out.println("-".repeat(70));
                System.out.println("Total: " + list.size() + " rows");
            }
        } else if (result instanceof Collection<?>) {
            Collection<?> col = (Collection<?>) result;

            if (col.isEmpty()) {
                System.out.println("NO DATA");
            } else {
                int idx = 1;
                for (Object obj : col) {
                    if (idx > 3) break;
                    System.out.println("[" + idx + "] " + formatObject(obj));
                    idx++;
                }
                System.out.println("-".repeat(70));
                System.out.println("Total: " + col.size() + " rows");
            }
        } else {
            System.out.println("Result: " + formatObject(result));
        }

        System.out.println("=".repeat(70) + "\n");
    }

    /**
     * save/delete 결과 데이터를 console에 출력
     */
    private void logSaveDeleteResult(String simpleClassName, String fullClassName, String methodName, String callerInfo, Object[] args, Object result) {
        System.out.println("\n" + "=".repeat(70));
        System.out.println("   Called From: " + callerInfo);
        System.out.println("   Interface: " + fullClassName + " " + simpleClassName + "." + methodName + "()");

        if (args.length > 0) {
            // save/delete의 첫 번째 파라미터는 엔티티
            if (methodName.startsWith("save")) {
                System.out.println("   Operation: INSERT/UPDATE");
                System.out.println("   Entity: " + formatObject(args[0]));
            } else if (methodName.startsWith("delete")) {
                System.out.println("   Operation: DELETE");
                if (args[0] instanceof java.util.Collection) {
                    System.out.println("   Entities: " + args[0].getClass().getSimpleName() + " (count: " + ((java.util.Collection<?>) args[0]).size() + ")");
                } else {
                    System.out.println("   Entity: " + formatObject(args[0]));
                }
            }
        }

        System.out.println("-".repeat(70));
        if (result != null) {
            System.out.println("Result: " + formatObject(result));
        } else {
            System.out.println("Result: null");
        }
        System.out.println("=".repeat(70) + "\n");
    }

    /**
     * 파라미터 배열을 포맷팅
     */
    private String formatParameters(Object[] args) {
        if (args == null || args.length == 0) {
            return "";
        }

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(formatParameterValue(args[i]));
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * 파라미터 값을 포맷팅
     */
    private String formatParameterValue(Object obj) {
        if (obj == null) {
            return "null";
        } else if (obj instanceof String) {
            return "'" + obj + "'";
        } else if (obj instanceof Number || obj instanceof Boolean) {
            return obj.toString();
        } else if (obj instanceof java.util.Map) {
            return "{...}";
        } else if (obj instanceof java.util.Collection) {
            java.util.Collection<?> col = (java.util.Collection<?>) obj;
            return "[" + col.size() + " items]";
        } else {
            return obj.getClass().getSimpleName() + "@" + Integer.toHexString(obj.hashCode());
        }
    }

    /**
     * 객체를 문자열로 포맷팅 - Reflection으로 필드 자동 추출
     */
    private String formatObject(Object obj) {
        if (obj == null) {
            return "null";
        }

        try {
            Class<?> clazz = obj.getClass();
            StringBuilder sb = new StringBuilder(clazz.getSimpleName()).append("{");

            Field[] fields = clazz.getDeclaredFields();
            boolean first = true;

            for (Field field : fields) {
                // static, transient, logger 등 제외
                if (java.lang.reflect.Modifier.isStatic(field.getModifiers()) ||
                    java.lang.reflect.Modifier.isTransient(field.getModifiers()) ||
                    field.getName().contains("logger")) {
                    continue;
                }

                field.setAccessible(true);
                Object value = field.get(obj);

                if (!first) sb.append(", ");
                sb.append(field.getName()).append("=");

                if (value == null) {
                    sb.append("null");
                } else if (value instanceof String) {
                    sb.append("'").append(value).append("'");
                } else if (value instanceof java.time.LocalDateTime ||
                           value instanceof java.time.LocalDate ||
                           value instanceof java.time.LocalTime) {
                    sb.append("'").append(value).append("'");
                } else {
                    sb.append(value);
                }

                first = false;
            }

            sb.append("}");
            return sb.toString();
        } catch (Exception e) {
            return obj.getClass().getSimpleName() + "@" + Integer.toHexString(obj.hashCode());
        }
    }
}
