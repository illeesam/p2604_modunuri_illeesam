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

    /** logRepositoryResult — 로그 */
    @Around("execution(public * com.shopjoy.ecadminapi.*.*.repository.*Repository.*(..))")
    public Object logRepositoryResult(ProceedingJoinPoint joinPoint) throws Throwable {
        boolean loggingEnabled = isLoggingEnabled();

        String methodName = joinPoint.getSignature().getName();
        String simpleClassName = getRepositorySimpleName(joinPoint);
        String fullClassName   = getRepositoryClassName(joinPoint);
        String callerInfo = loggingEnabled ? getCallerInfo() : null;
        Object[] args = joinPoint.getArgs();

        try {
            Object result = joinPoint.proceed();

            if (loggingEnabled) {
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

    /** isLoggingEnabled — 여부 */
    private boolean isLoggingEnabled() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles.length == 0) return false;
        String p = activeProfiles[0];
        return "local".equalsIgnoreCase(p) || "dev".equalsIgnoreCase(p);
    }

    /** 프록시 없이 실제 인터페이스 심플명 반환 */
    private String getRepositorySimpleName(ProceedingJoinPoint joinPoint) {
        String name = joinPoint.getTarget().getClass().getSimpleName();
        if (name.contains("$") || name.contains("Enhancer")) {
            return joinPoint.getSignature().getDeclaringType().getSimpleName();
        }
        return name;
    }

    /** 프록시 없이 실제 인터페이스 FQCN 반환 */
    private String getRepositoryClassName(ProceedingJoinPoint joinPoint) {
        try {
            Class<?>[] interfaces = joinPoint.getTarget().getClass().getInterfaces();
            if (interfaces.length > 0) return interfaces[0].getName();
        } catch (Exception ignored) {}
        return joinPoint.getSignature().getDeclaringType().getName();
    }

    /** getCallerInfo — 조회 */
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

    /** logResult — 로그 */
    private void logResult(String simpleClassName, String fullClassName, String methodName,
                           String callerInfo, Object[] args, Object result) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n").append("=".repeat(70)).append("\n");
        sb.append("   Called From: ").append(callerInfo).append("\n");
        sb.append("   Interface: ").append(fullClassName).append(" ").append(simpleClassName)
          .append(".").append(methodName).append("()\n");
        if (args.length > 0) {
            sb.append("   Parameters: ").append(formatParameters(args)).append("\n");
        }
        sb.append("=".repeat(70)).append("\n");

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

    /** logSaveDeleteResult — 로그 */
    private void logSaveDeleteResult(String simpleClassName, String fullClassName, String methodName,
                                     String callerInfo, Object[] args, Object result) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n").append("=".repeat(70)).append("\n");
        sb.append("   Called From: ").append(callerInfo).append("\n");
        sb.append("   Interface: ").append(fullClassName).append(" ").append(simpleClassName)
          .append(".").append(methodName).append("()\n");

        if (args.length > 0) {
            if (methodName.startsWith("save")) {
                sb.append("   Operation: INSERT/UPDATE\n");
                sb.append("   Entity: ").append(formatObject(args[0])).append("\n");
            } else if (methodName.startsWith("delete")) {
                sb.append("   Operation: DELETE\n");
                if (args[0] instanceof Collection<?> c) {
                    sb.append("   Entities: ").append(args[0].getClass().getSimpleName())
                      .append(" (count: ").append(c.size()).append(")\n");
                } else {
                    sb.append("   Entity: ").append(formatObject(args[0])).append("\n");
                }
            }
        }

        sb.append("-".repeat(70)).append("\n");
        sb.append("Result: ").append(result != null ? formatObject(result) : "null").append("\n");
        sb.append("=".repeat(70));
        log.debug("{}", sb);
    }

    /** formatParameters — 포맷 */
    private String formatParameters(Object[] args) {
        if (args == null || args.length == 0) return "";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(formatParameterValue(args[i]));
        }
        return sb.append("]").toString();
    }

    /** formatParameterValue — 포맷 */
    private String formatParameterValue(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "'" + obj + "'";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();
        if (obj instanceof java.util.Map) return "{...}";
        if (obj instanceof Collection<?> c) return "[" + c.size() + " items]";
        return obj.getClass().getSimpleName() + "@" + Integer.toHexString(obj.hashCode());
    }

    /** formatObject — 포맷 */
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
