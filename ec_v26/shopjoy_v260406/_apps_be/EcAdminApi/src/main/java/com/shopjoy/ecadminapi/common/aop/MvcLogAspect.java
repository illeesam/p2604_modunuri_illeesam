package com.shopjoy.ecadminapi.common.aop;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * MVC 계층 호출 추적 로깅 AOP Aspect.
 *
 * <p>역할/책임: Controller / Client / Service / Repository / Mapper 메서드의 진입·반환·예외를
 * 가로채 입력 파라미터, 요청 정보(메서드/URI/X-UI-Nm·X-Cmd-Nm 헤더), 반환 객체 요약을
 * "MVC_LOG" 로거로 출력한다. 계층별로 다른 화살표 프리픽스(▶/◀ 깊이)를 붙여 호출 흐름을
 * 시각적으로 구분한다.</p>
 *
 * <p>동작 시점: {@code @Around} 어드바이스가 5개 계층 포인트컷 합집합에 적용된다.
 * local/dev 프로파일에서만 활성화되며(운영 성능 영향 차단), 그 외에는 즉시 proceed 한다.</p>
 *
 * <p>주의: 토큰 발급 계층(클래스명에 TOKENSERVICE 포함)은 자격증명 노출 방지를 위해
 * 로그를 생략한다. 출력은 {@link #OUTPUT_TRUNCATE_THRESHOLD} 초과 시
 * {@link #OUTPUT_MAX_LEN} 길이로 절단한다.</p>
 */
@Aspect
@Component
public class MvcLogAspect {
    private static final Logger logger = LoggerFactory.getLogger("MVC_LOG");
    /** 출력 절단 시 보존할 최대 길이(문자). 너무 긴 응답이 로그를 점유하지 않도록 제한. */
    private static final int OUTPUT_MAX_LEN = 300;
    /** 이 길이를 초과하면 절단을 수행하는 임계값. 임계값과 보존 길이를 분리해 잦은 substring 회피. */
    private static final int OUTPUT_TRUNCATE_THRESHOLD = 400;

    @Autowired
    private Environment environment;

    /**
     * 컴포넌트 계층 유형. 클래스명 키워드로 분류하며, 진입/반환 로그에 붙일 화살표 프리픽스를
     * 보유한다(계층이 깊을수록 화살표 개수 증가 → 호출 깊이 시각화).
     */
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

        /** 진입(IN) 로그 라인 프리픽스 반환. */
        String getInPrefix() {
            return inPrefix;
        }

        /** 반환/예외(OUT) 로그 라인 프리픽스 반환. */
        String getOutPrefix() {
            return outPrefix;
        }

        /**
         * 클래스 단순명에 포함된 키워드로 계층 유형을 판별한다.
         *
         * @param className 대상 클래스 단순명(프록시 제거된 실제 이름 권장)
         * @return 매칭되는 {@link ComponentType}, 어느 것에도 해당 없으면 {@link #DEFAULT}.
         *         대소문자 무시 비교(키워드는 대문자 변환 후 contains)
         */
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

    /** Controller 계층 포인트컷: com.shopjoy 하위 이름이 {@code *Controller} 인 모든 public 메서드. */
    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Controller.*(..))")
    private void controllerLayer() {}

    /** Client 계층 포인트컷: 이름이 {@code *Client} 인 외부 호출 클라이언트 메서드. */
    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Client.*(..))")
    private void clientLayer() {}

    /** Service 계층 포인트컷: 이름에 {@code Service} 가 포함된 클래스(ServiceImpl 등 변형 포함)의 메서드. */
    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Service*.*(..))")
    private void serviceLayer() {}

    /** Repository 계층 포인트컷: 이름이 {@code *Repository} 인 JPA 리포지토리 메서드. */
    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Repository.*(..))")
    private void repositoryLayer() {}

    /** Mapper 계층 포인트컷: 이름이 {@code *Mapper} 인 MyBatis 매퍼 메서드. */
    @org.aspectj.lang.annotation.Pointcut("execution(* com.shopjoy..*Mapper.*(..))")
    private void mapperLayer() {}

    /**
     * 메서드 진입·반환·예외를 가로채 호출 흐름을 로깅하는 핵심 어드바이스.
     *
     * <p>흐름: (1) local/dev 아니면 즉시 proceed (2) 컴포넌트명/메서드명/계층유형 추출
     * (3) 입력 파라미터·요청정보로 IN 로그 (4) proceed 호출, 예외 시 ERROR 로그 후 재던짐
     * (5) 반환 객체 클래스·문자열로 OUT 로그.</p>
     *
     * @param pjp 가로챈 조인포인트(인자, 시그니처, 타깃 보유)
     * @return 원본 메서드의 반환값을 그대로 전달(로깅은 부수효과일 뿐 결과를 변형하지 않음)
     * @throws Throwable 원본 메서드가 던진 예외는 ERROR 로그 후 그대로 재전파
     *                   (로깅이 예외 전파를 삼키지 않음)
     */
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
     * 로깅 활성화 여부 확인.
     *
     * @return 활성 프로파일 첫 항목이 local 또는 dev 이면 true. 활성 프로파일이 비어 있으면
     *         false (운영/미지정 환경에서는 로깅 비활성으로 안전 측 처리). 다중 프로파일 시
     *         첫 번째만 판정함에 유의
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
     * 로그에 표기할 컴포넌트 단순명을 조회한다.
     *
     * @param pjp 조인포인트
     * @return 타깃 클래스 단순명. 타깃이 null 이면 선언 타입명. CGLIB/JDK 프록시
     *         (이름에 '$' 또는 'Enhancer' 포함)인 경우 노이즈 제거를 위해 선언 인터페이스명으로 대체
     */
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

    /**
     * 입력 인자를 로그용 문자열로 포맷한다.
     *
     * @param pjp 조인포인트(인자 배열 보유)
     * @return 인자 없으면 빈 문자열, 1개면 그 값의 문자열, 2개 이상이면 {@code args[i]} 라벨로 줄바꿈 나열.
     *         결과에 중괄호('{','}')가 있으면 Map/객체 toString 으로 간주해 키-값을 줄 단위로 펼침(가독성용 정형화).
     *         null 인자는 "null" 로 출력됨
     */
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

    /**
     * 현재 HTTP 요청의 핵심 정보를 한 줄 문자열로 추출한다.
     *
     * <p>HttpServletRequest 를 인자에서 우선 탐색하고, 없으면 {@link RequestContextHolder} 의
     * 스레드 바인딩 요청을 사용한다(비웹 컨텍스트면 빈 문자열). X-UI-Nm·X-Cmd-Nm 헤더는
     * URL 인코딩될 수 있어 디코딩한다.</p>
     *
     * @param pjp 조인포인트
     * @return {@code METHOD URI?query  [화면명 > 커맨드명]} 형태. 요청 없으면 빈 문자열.
     *         uiNm/cmdNm 둘 다 없으면 대괄호 구간 생략
     */
    private String extractRequestInfo(ProceedingJoinPoint pjp) {
        // args 중 HttpServletRequest 우선, 없으면 RequestContextHolder에서 조회
        HttpServletRequest req = null;
        for (Object obj : pjp.getArgs()) {
            if (obj instanceof HttpServletRequest) { req = (HttpServletRequest) obj; break; }
        }
        if (req == null) {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) req = attrs.getRequest();
        }
        if (req == null) return "";

        String uiNm  = decode(nvl(req.getHeader("X-UI-Nm")));
        String cmdNm = decode(nvl(req.getHeader("X-Cmd-Nm")));
        String qs    = req.getQueryString();

        StringBuilder sb = new StringBuilder();
        sb.append(req.getMethod()).append(" ").append(req.getRequestURI());
        if (qs != null && !qs.isEmpty()) sb.append("?").append(qs);
        if (!uiNm.isEmpty() || !cmdNm.isEmpty()) {
            sb.append("  [").append(uiNm);
            if (!uiNm.isEmpty() && !cmdNm.isEmpty()) sb.append(" > ");
            sb.append(cmdNm).append("]");
        }
        return sb.toString();
    }

    /**
     * null 을 빈 문자열로 치환한다(null-safe 출력용).
     *
     * @param s 원본(널 허용)
     * @return s 가 null 이면 "", 아니면 s 그대로
     */
    private static String nvl(String s) { return s != null ? s : ""; }

    /**
     * UTF-8 URL 디코딩한다(헤더의 한글 인코딩 복원용).
     *
     * @param s 디코딩 대상(널/빈 문자열이면 그대로 반환)
     * @return 디코딩 결과. 디코딩 실패 시 원본 문자열을 그대로 반환(로깅이 깨지지 않도록 예외 흡수)
     */
    private static String decode(String s) {
        if (s == null || s.isEmpty()) return s;
        try { return java.net.URLDecoder.decode(s, "UTF-8"); }
        catch (Exception e) { return s; }
    }

    /**
     * 메서드 진입(IN) 로그를 INFO 레벨로 출력한다.
     *
     * @param type       계층 유형(프리픽스 결정)
     * @param className  컴포넌트 단순명
     * @param methodName 메서드명
     * @param params     포맷된 입력 파라미터 문자열
     * @param reqInfo    요청 정보(있으면 줄바꿈 후 params 부착, 없으면 ' : params')
     *                   클래스명에 TOKENSERVICE 포함 시 자격증명 노출 방지를 위해 로그 생략(early return)
     */
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

    /**
     * 메서드 정상 반환(OUT) 로그를 INFO 레벨로 출력한다.
     *
     * @param type         계층 유형(프리픽스 결정)
     * @param className    컴포넌트 단순명
     * @param methodName   메서드명
     * @param outObjName   반환 객체 클래스 단순명(oc)
     * @param strOutParams 반환이 String 일 때 그 값(od, 절단 적용)
     * @param reqInfo      요청 정보(Controller 계층에서만 끝에 부착 — 호출 흐름 진입점 식별용)
     *                     클래스명에 TOKENSERVICE 포함 시 로그 생략
     */
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

    /**
     * 출력 문자열을 길이 제한으로 절단한다.
     *
     * @param output 원본 출력(널/빈 문자열이면 그대로 반환)
     * @return 길이가 {@link #OUTPUT_TRUNCATE_THRESHOLD}(400) 초과면 앞
     *         {@link #OUTPUT_MAX_LEN}(300) 자만, 아니면 원본 그대로.
     *         임계값(400)과 보존 길이(300)를 달리 둔 것은 400 이하의 비교적 짧은
     *         출력은 통째로 보존하기 위한 의도
     */
    private String truncateOutput(String output) {
        if (output == null || output.isEmpty()) {
            return output;
        }
        return output.length() > OUTPUT_TRUNCATE_THRESHOLD
                ? output.substring(0, OUTPUT_MAX_LEN)
                : output;
    }

    /**
     * 메서드 실행 중 예외 발생 시 ERROR 로그를 출력한다.
     *
     * <p>스택트레이스에서 {@code com.shopjoy} 로 시작하는 첫 프레임을 찾아
     * 클래스.메서드:라인 형태로 발생 위치를 요약한다(프레임워크 내부 스택 노이즈 제거).</p>
     *
     * @param type       계층 유형(프리픽스 결정)
     * @param className  컴포넌트 단순명
     * @param methodName 메서드명
     * @param ex         발생한 예외(메시지 null 이면 "No message" 사용)
     * @param reqInfo    요청 정보(있으면 Request 라인 부착)
     *                   클래스명에 TOKENSERVICE 포함 시 로그 생략
     */
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
