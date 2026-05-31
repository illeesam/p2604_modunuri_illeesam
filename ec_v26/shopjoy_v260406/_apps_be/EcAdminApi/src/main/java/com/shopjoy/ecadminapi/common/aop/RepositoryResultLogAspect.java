package com.shopjoy.ecadminapi.common.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Component;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

        /* 로그 노이즈 억제 — 감사 로그(SyhAccessLog) 자동 저장은 매 요청 끝에 호출되어 화면과 무관.
         *   비즈니스 SQL 가독성 보호를 위해 결과/상세 박스 출력 생략. */
        if (loggingEnabled && (simpleClassName.contains("SyhAccessLog") || fullClassName.contains("SyhAccessLog"))) {
            return joinPoint.proceed();
        }

        String callerInfo = loggingEnabled ? getCallerInfo() : null;
        Object[] args = joinPoint.getArgs();
        String[] paramNames = loggingEnabled ? getParamNames(joinPoint) : null;

        boolean isSaveDelete = methodName.startsWith("save") || methodName.startsWith("delete");

        // 1단계: proceed() 전에 헤더 박스 출력 → 그 사이에 실제 SQL 로그가 끼어든다.
        if (loggingEnabled) {
            if (isSaveDelete) {
                logSaveDeleteHeader(simpleClassName, fullClassName, methodName, callerInfo, args);
            } else {
                logResultHeader(simpleClassName, fullClassName, methodName, callerInfo, args, paramNames);
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
                                 String callerInfo, Object[] args, String[] paramNames) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n").append("▶▶▶ ").append("=".repeat(65)).append("\n");
        sb.append("   Called From: ").append(callerInfo).append("\n");
        sb.append("   Interface: ").append(fullClassName).append(" ").append(simpleClassName)
          .append(".").append(methodName).append("()");
        if (args.length > 0) {
            sb.append("\n   Parameters: ").append(formatNamedParameters(paramNames, args));
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
        StringBuilder sb = new StringBuilder();
        sb.append("\n┌── 결과 미리보기 (최대 3행) ─────────────────────────\n");

        if (result == null) {
            sb.append("   Result: null\n");
        } else if (result instanceof java.util.Optional<?> optional) {
            if (optional.isEmpty()) {
                sb.append("   Result: Optional.empty\n");
            } else {
                appendVerticalTable(sb, optional.get());
            }
        } else if (result instanceof Collection<?> col) {
            if (col.isEmpty()) {
                sb.append("   NO DATA\n");
            } else {
                List<Object> rows = new ArrayList<>(col);
                appendTable(sb, rows, rows.size());
            }
        } else if (result instanceof String || result instanceof Number || result instanceof Boolean ||
                   result instanceof Character || result instanceof Enum<?> ||
                   result instanceof java.time.LocalDateTime || result instanceof java.time.LocalDate ||
                   result instanceof java.time.LocalTime || result instanceof java.util.Date) {
            // COUNT/단일값 스칼라 — 세로 표 (value 컬럼)
            appendVerticalTable(sb, result);
        } else {
            // 단건 DTO/Entity/Map/Object[] — 세로 표 (필드 | 값)
            appendVerticalTable(sb, result);
        }

        sb.append("└─────────────────────────────────────────────────────");
        log.debug("{}", sb);
    }

    /**
     * 단건 객체를 (필드 | 값) 2열 세로 표로 sb 에 추가.
     *
     * <p>Map/Object[]/DTO/Entity 공통으로 {@link #extractRow} 결과를 행 단위로 풀어
     * 한 줄에 한 필드씩 출력한다. 다건 표(여러 행) 와 시각적으로 구분되어
     * PageResponse/단건 Entity 의 가독성이 높아진다.</p>
     */
    private void appendVerticalTable(StringBuilder sb, Object obj) {
        LinkedHashMap<String, String> row = extractRow(obj);
        if (row.isEmpty()) {
            sb.append("   (no extractable fields)\n");
            return;
        }
        int keyWidth = 0;
        int valWidth = 0;
        for (Map.Entry<String, String> e : row.entrySet()) {
            keyWidth = Math.max(keyWidth, displayWidth(e.getKey()));
            valWidth = Math.max(valWidth, displayWidth(e.getValue()));
        }
        keyWidth = Math.max(keyWidth, displayWidth("field"));
        valWidth = Math.max(valWidth, displayWidth("value"));

        // 헤더 + 구분선
        sb.append("   | ").append(padRight("field", keyWidth)).append(" | ")
          .append(padRight("value", valWidth)).append(" |\n");
        sb.append("   |").append("-".repeat(keyWidth + 2)).append("|")
          .append("-".repeat(valWidth + 2)).append("|\n");
        for (Map.Entry<String, String> e : row.entrySet()) {
            sb.append("   | ").append(padRight(e.getKey(), keyWidth)).append(" | ")
              .append(padRight(e.getValue(), valWidth)).append(" |\n");
        }
    }

    /**
     * 결과 행을 표 형태로 sb 에 추가한다. 최대 3행 미리보기 + Total 표기.
     *
     * <p>행 타입 분기:
     * <ul>
     *   <li>{@code Object[]} — 인덱스 col1,col2... 컬럼</li>
     *   <li>{@code Map} — 키를 컬럼명</li>
     *   <li>{@code DTO/Entity} — reflection 필드명을 컬럼명</li>
     *   <li>스칼라(String/Number/Boolean/temporal) — 단일 value 컬럼</li>
     * </ul>
     * 컬럼 너비는 첫 3행 + 헤더 길이 중 최대값. 셀 값이 40자를 넘으면 "..." 으로 절단.</p>
     */
    private void appendTable(StringBuilder sb, List<?> rows, int totalCount) {
        int previewCnt = Math.min(3, rows.size());
        List<LinkedHashMap<String, String>> previewRows = new ArrayList<>(previewCnt);
        LinkedHashMap<String, Integer> widths = new LinkedHashMap<>();

        // 1) 미리보기 행을 (컬럼명→문자열값) 으로 정규화 + 누적 컬럼 순서/너비 산출
        for (int i = 0; i < previewCnt; i++) {
            LinkedHashMap<String, String> row = extractRow(rows.get(i));
            previewRows.add(row);
            for (Map.Entry<String, String> e : row.entrySet()) {
                int valLen = displayWidth(e.getValue());
                int hdrLen = displayWidth(e.getKey());
                int cur = widths.getOrDefault(e.getKey(), 0);
                widths.put(e.getKey(), Math.max(cur, Math.max(valLen, hdrLen)));
            }
        }

        if (widths.isEmpty()) {
            sb.append("   (no extractable fields)\n");
            sb.append("   Total: ").append(totalCount).append(" rows\n");
            return;
        }

        // 2) 헤더 / 구분선 / 데이터 행 출력
        sb.append("   ").append(formatTableRow(widths.keySet().stream().toList(), widths, null)).append("\n");
        sb.append("   ").append(formatSeparator(widths)).append("\n");
        for (LinkedHashMap<String, String> row : previewRows) {
            sb.append("   ").append(formatTableRow(widths.keySet().stream().toList(), widths, row)).append("\n");
        }
        sb.append("   Total: ").append(totalCount).append(" rows\n");
    }

    /** 한 행을 컬럼명→값 맵으로 추출. 타입별 분기. */
    private LinkedHashMap<String, String> extractRow(Object row) {
        LinkedHashMap<String, String> out = new LinkedHashMap<>();
        if (row == null) {
            out.put("value", "null");
            return out;
        }
        // 1) Object[] — col1, col2 ... 자동
        if (row instanceof Object[] arr) {
            for (int i = 0; i < arr.length; i++) {
                out.put("col" + (i + 1), cellText(arr[i]));
            }
            return out;
        }
        // 2) Map
        if (row instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> e : map.entrySet()) {
                out.put(String.valueOf(e.getKey()), cellText(e.getValue()));
            }
            return out;
        }
        // 3) 스칼라 / 시간 — 단일 컬럼
        if (row instanceof String || row instanceof Number || row instanceof Boolean ||
            row instanceof Character || row instanceof Enum<?> ||
            row instanceof java.time.LocalDateTime || row instanceof java.time.LocalDate ||
            row instanceof java.time.LocalTime || row instanceof java.util.Date) {
            out.put("value", cellText(row));
            return out;
        }
        // 4) DTO/Entity — reflection 필드 덤프
        try {
            Class<?> clazz = row.getClass();
            if (clazz.getName().contains("$$")) {
                Class<?> sc = clazz.getSuperclass();
                if (sc != null && sc != Object.class) clazz = sc;
            }
            List<Class<?>> chain = new ArrayList<>();
            for (Class<?> c = clazz; c != null && c != Object.class; c = c.getSuperclass()) chain.add(0, c);
            for (Class<?> c : chain) {
                for (Field f : c.getDeclaredFields()) {
                    int mod = f.getModifiers();
                    if (Modifier.isStatic(mod) || Modifier.isTransient(mod)) continue;
                    if (f.getName().startsWith("$") || f.getName().contains("logger") || f.getName().contains("CACHE")) continue;
                    f.setAccessible(true);
                    Object v = f.get(row);
                    out.put(f.getName(), cellText(v));
                }
            }
        } catch (Exception ignored) {
            out.put("value", row.getClass().getSimpleName() + "@" + Integer.toHexString(row.hashCode()));
        }
        return out;
    }

    /** 셀 값 문자열화 — null 은 빈 문자열, 컬렉션은 [n], 너무 길면 절단. */
    private String cellText(Object v) {
        if (v == null) return "";
        String s;
        if (v instanceof Collection<?> c) s = "[" + c.size() + " items]";
        else if (v instanceof Map<?, ?> m) s = "{" + m.size() + " entries}";
        else if (v.getClass().isArray()) s = "[" + java.lang.reflect.Array.getLength(v) + " items]";
        else s = String.valueOf(v);
        s = s.replace("\n", " ").replace("\r", " ").replace("\t", " ");
        if (s.length() > 40) s = s.substring(0, 37) + "...";
        return s;
    }

    /** 표 한 행 포맷: {@code | val1 | val2 |}. row 가 null 이면 헤더 행으로 간주. */
    private String formatTableRow(List<String> cols, LinkedHashMap<String, Integer> widths, Map<String, String> row) {
        StringBuilder sb = new StringBuilder("|");
        for (String col : cols) {
            String value = row == null ? col : row.getOrDefault(col, "");
            int width = widths.get(col);
            sb.append(' ').append(padRight(value, width)).append(" |");
        }
        return sb.toString();
    }

    /** 구분선 포맷: {@code |---|---|}. */
    private String formatSeparator(LinkedHashMap<String, Integer> widths) {
        StringBuilder sb = new StringBuilder("|");
        for (int w : widths.values()) {
            sb.append("-".repeat(w + 2)).append("|");
        }
        return sb.toString();
    }

    /** 한글 등 광폭 문자는 폭 2 로 카운트. */
    private int displayWidth(String s) {
        if (s == null) return 0;
        int w = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            w += (c >= 0x1100 && (c <= 0x115F || (c >= 0x2E80 && c <= 0x9FFF) ||
                 (c >= 0xA960 && c <= 0xA97F) || (c >= 0xAC00 && c <= 0xD7A3) ||
                 (c >= 0xF900 && c <= 0xFAFF) || (c >= 0xFE30 && c <= 0xFE4F) ||
                 (c >= 0xFF00 && c <= 0xFF60) || (c >= 0xFFE0 && c <= 0xFFE6))) ? 2 : 1;
        }
        return w;
    }

    /** 광폭 문자 고려한 우측 공백 패딩. */
    private String padRight(String s, int targetWidth) {
        int cur = displayWidth(s);
        if (cur >= targetWidth) return s;
        return s + " ".repeat(targetWidth - cur);
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
     * 파라미터를 {@code [name1=v1, name2=v2, ...]} 형태로 포맷한다.
     *
     * <p>paramNames 가 비어있거나 일부가 누락되면 인덱스(arg0/arg1...)로 대체.
     * Repository 의 {@code @Param("xxx")} 어노테이션이 우선, 없으면 reflection 파라미터명 사용.</p>
     */
    private String formatNamedParameters(String[] paramNames, Object[] args) {
        if (args == null || args.length == 0) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            String name = (paramNames != null && i < paramNames.length && paramNames[i] != null)
                    ? paramNames[i] : ("arg" + i);
            sb.append(name).append("=").append(formatParameterValue(args[i]));
        }
        return sb.append("]").toString();
    }

    /**
     * 메서드 파라미터의 이름 배열을 추출한다.
     *
     * <p>우선순위: (1) {@link Param @Param("...")} 어노테이션 값, (2) reflection 파라미터명
     * ({@code -parameters} 컴파일 옵션 필요), (3) 둘 다 없으면 null 슬롯.</p>
     */
    private String[] getParamNames(ProceedingJoinPoint joinPoint) {
        try {
            MethodSignature sig = (MethodSignature) joinPoint.getSignature();
            Method method = sig.getMethod();
            Annotation[][] paramAnns = method.getParameterAnnotations();
            java.lang.reflect.Parameter[] params = method.getParameters();
            String[] names = new String[paramAnns.length];
            for (int i = 0; i < paramAnns.length; i++) {
                for (Annotation a : paramAnns[i]) {
                    if (a instanceof Param p) {
                        names[i] = p.value();
                        break;
                    }
                }
                if (names[i] == null && params[i].isNamePresent()) {
                    names[i] = params[i].getName();
                }
            }
            return names;
        } catch (Exception ignored) {
            return null;
        }
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
        return AopFormatUtil.formatObject(obj);
    }

    /** AopFormatUtil 위임 — 객체 필드 덤프 (호환성 유지용 래퍼) */
    private String formatObject(Object obj) {
        return AopFormatUtil.formatObject(obj);
    }
}
