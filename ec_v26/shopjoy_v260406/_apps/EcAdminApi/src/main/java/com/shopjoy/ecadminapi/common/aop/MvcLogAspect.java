package com.shopjoy.ecadminapi.common.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class MvcLogAspect {
    private static final Logger logger = LoggerFactory.getLogger(MvcLogAspect.class);
    private static final int OUTPUT_MAX_LEN = 300;
    private static final int OUTPUT_TRUNCATE_THRESHOLD = 400;

    @Autowired
    private Environment environment;

    enum ComponentType {
        CONTROLLER("■■ ▶", "■■ ◀"),
        CLIENT("■■ ■", "■■ ◀"),
        SERVICE("■■ ▶▶", "■■ ◀◀"),
        MAPPER("■■ ▶▶▶", "■■ ◀◀◀"),
        REPOSITORY("■■ ▶▶▶", "■■ ◀◀◀"),
        DEFAULT("■■ ▶", "■■ ◀");

        private final String inPrefix;
        private final String outPrefix;

        ComponentType(String inPrefix, String outPrefix) {
            this.inPrefix = inPrefix;
            this.outPrefix = outPrefix;
        }

        String getInPrefix() {
            return inPrefix;
        }

        String getOutPrefix() {
            return outPrefix;
        }

        static ComponentType fromClassName(String className) {
            String upper = className.toUpperCase();
            if (upper.contains("CONTROLLER")) return CONTROLLER;
            if (upper.contains("CLIENT")) return CLIENT;
            if (upper.contains("SERVICE")) return SERVICE;
            if (upper.contains("MAPPER")) return MAPPER;
            if (upper.contains("REPOSITORY")) return REPOSITORY;
            return DEFAULT;
        }
    }

    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Controller.*(..))")
    private void controllerLayer() {}

    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Client.*(..))")
    private void clientLayer() {}

    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Service*.*(..))")
    private void serviceLayer() {}

    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Repository.*(..))")
    private void repositoryLayer() {}

    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Mapper.*(..))")
    private void mapperLayer() {}

    @Around("controllerLayer() || clientLayer() || serviceLayer() || repositoryLayer() || mapperLayer()")
    public Object logging(ProceedingJoinPoint pjp) throws Throwable {
        // local/dev profile일 때만 로깅
        if (!isLoggingEnabled()) {
            return pjp.proceed();
        }

        String simpleName = getComponentName(pjp);
        String methodName = pjp.getSignature().getName();
        ComponentType type = ComponentType.fromClassName(simpleName);

        String strInParams = formatInputParams(pjp);
        String reqInfo = extractRequestInfo(pjp);

        logMethodIn(type, simpleName, methodName, strInParams, reqInfo);

        Object result = null;
        String outObjName = "";
        String strOutParams = "";

        try {
            result = pjp.proceed();
        } catch (Throwable ex) {
            logMethodError(type, simpleName, methodName, ex, reqInfo);
            throw ex;
        }

        if (result != null) {
            outObjName = result.getClass().getSimpleName();
            if (result instanceof String) {
                strOutParams = (String) result;
            }
        }

        logMethodOut(type, simpleName, methodName, outObjName, strOutParams, reqInfo);

        return result;
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

    private String getComponentName(ProceedingJoinPoint pjp) {
        Object target = pjp.getTarget();
        if (target == null) return pjp.getSignature().getDeclaringType().getSimpleName();
        String name = target.getClass().getSimpleName();
        /* JPA/Spring 프록시($Proxy, $$EnhancerBy 등) → 선언 인터페이스명으로 대체 */
        if (name.contains("$") || name.contains("Enhancer")) {
            name = pjp.getSignature().getDeclaringType().getSimpleName();
        }
        return name;
    }

    private String formatInputParams(ProceedingJoinPoint pjp) {
        Object[] args = pjp.getArgs();
        if (args == null || args.length == 0) return "";

        if (args.length == 1) {
            return String.valueOf(args[0]);
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < args.length; i++) {
            sb.append("\n    args[").append(i).append("] ").append(args[i]);
        }

        String result = sb.toString();
        if (result.contains("{") && result.contains("}")) {
            result = result.replace(", ", "\n ____ ")
                    .replace("{", "\n ____ ")
                    .replace("}", "")
                    .replace("=", " = ");
        }

        return result;
    }

    private String extractRequestInfo(ProceedingJoinPoint pjp) {
        Object[] args = pjp.getArgs();
        if (args == null) return "";

        for (Object obj : args) {
            if (obj instanceof HttpServletRequest || obj instanceof MultipartHttpServletRequest) {
                HttpServletRequest request = (HttpServletRequest) obj;
                StringBuilder sb = new StringBuilder();
                sb.append(request.getMethod()).append(" ")
                  .append(request.getRequestURL());

                String qs = request.getQueryString();
                if (qs != null) {
                    sb.append("?").append(qs);
                }

                String token = request.getHeader("Authorization");
                if (token != null) {
                    sb.append(" [").append(token).append("]");
                }

                return sb.toString();
            }
        }

        return "";
    }

    private void logMethodIn(ComponentType type, String className, String methodName,
                             String params, String reqInfo) {
        if (className.toUpperCase().contains("TOKENSERVICE")) {
            return;
        }

        String msg = type.getInPrefix() + " : [" + className + " | " + methodName + "]";
        if (!reqInfo.isEmpty()) {
            msg += " : " + reqInfo + "\n" + params;
        } else {
            msg += " : " + params;
        }

        logger.info(msg);
    }

    private void logMethodOut(ComponentType type, String className, String methodName,
                              String outObjName, String strOutParams, String reqInfo) {
        if (className.toUpperCase().contains("TOKENSERVICE")) {
            return;
        }

        String truncatedOutput = truncateOutput(strOutParams);
        String msg = type.getOutPrefix() + " : " + className + " " + methodName + "(), oc:"
                     + outObjName + ", od:" + truncatedOutput;

        if (!reqInfo.isEmpty() && type == ComponentType.CONTROLLER) {
            msg += ", " + reqInfo;
        }

        logger.info(msg);
    }

    private String truncateOutput(String output) {
        if (output == null || output.isEmpty()) {
            return output;
        }
        return output.length() > OUTPUT_TRUNCATE_THRESHOLD
                ? output.substring(0, OUTPUT_MAX_LEN)
                : output;
    }

    private void logMethodError(ComponentType type, String className, String methodName,
                                Throwable ex, String reqInfo) {
        if (className.toUpperCase().contains("TOKENSERVICE")) {
            return;
        }

        String exceptionType = ex.getClass().getSimpleName();
        String errorMessage = ex.getMessage() != null ? ex.getMessage() : "No message";

        // 스택 트레이스에서 첫 번째 애플리케이션 스택 라인 추출
        String stackLine = "";
        StackTraceElement[] stackTrace = ex.getStackTrace();
        for (StackTraceElement element : stackTrace) {
            if (element.getClassName().startsWith("com.shopjoy")) {
                stackLine = element.getClassName() + "." + element.getMethodName() +
                           ":" + element.getLineNumber();
                break;
            }
        }

        String msg = type.getOutPrefix() + " ✗ ERROR : " + className + " " + methodName + "()";
        msg += "\n      Exception: " + exceptionType;
        msg += "\n      Message: " + errorMessage;
        if (!stackLine.isEmpty()) {
            msg += "\n      At: " + stackLine;
        }
        if (!reqInfo.isEmpty()) {
            msg += "\n      Request: " + reqInfo;
        }

        logger.error(msg);
    }
}
