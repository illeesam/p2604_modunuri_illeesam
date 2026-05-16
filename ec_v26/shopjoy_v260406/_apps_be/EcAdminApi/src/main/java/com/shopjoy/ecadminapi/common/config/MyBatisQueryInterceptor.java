package com.shopjoy.ecadminapi.common.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;

import java.util.List;
import java.util.Properties;

/**
 * MyBatis 쿼리 실행 인터셉터 (local/dev 전용).
 *
 * query/update 실행 후 Mapper 메서드명과 결과 건수를 DEBUG 로그로 출력한다.
 * P6SpyFormatter와 연동해 SQL 헤더에 "MbMemberMapper.selectPageList [12ms]" 형태로 표시.
 *
 * ThreadLocal로 현재 실행 중인 Mapper 정보를 P6SpyFormatter에 전달한다.
 * 요청이 끝나면 반드시 remove()로 정리하여 스레드 풀 오염을 방지한다.
 */
@Slf4j
@Intercepts({
    // Executor.query(MappedStatement, parameter, RowBounds, ResultHandler) — SELECT 4-arg 시그니처
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    // Executor.update(MappedStatement, parameter) — INSERT/UPDATE/DELETE 공통 시그니처
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class MyBatisQueryInterceptor implements Interceptor {

    /** 결과 미리보기로 출력할 최대 행 수. 로그 폭주 방지를 위한 상한. */
    private static final int PREVIEW_ROWS = 3;

    /** P6SpyFormatter가 읽는 현재 Mapper 정보 (스레드 로컬) */
    private static final ThreadLocal<String>  MAPPER_INFO    = new ThreadLocal<>();
    /** P6SpyFormatter가 읽는 쿼리 결과 요약 (스레드 로컬) */
    private static final ThreadLocal<String>  RESULT_SUMMARY = new ThreadLocal<>();

    /**
     * 현재 스레드에서 실행 중인 {@code Mapper.메서드명} 을 반환한다(P6SpyFormatter 헤더용).
     *
     * @return 단축 매퍼 식별자(예: "MbMemberMapper.selectPageList"). 인터셉트 전이면 null
     */
    public static String getCurrentMapperInfo() { return MAPPER_INFO.get(); }

    /**
     * 결과 요약 문자열을 반환하고 ThreadLocal 에서 즉시 제거한다(1회성 소비).
     *
     * @return 직전 쿼리 결과 요약. 없으면 null.
     *         poll 후 remove 하여 동일 스레드 재사용 시 이전 결과가 오염되지 않도록 보장
     */
    public static String pollResultSummary() {
        String s = RESULT_SUMMARY.get();
        RESULT_SUMMARY.remove();
        return s;
    }

    /**
     * query/update 실행을 가로채 매퍼 정보와 결과 요약을 ThreadLocal 에 저장한다.
     *
     * @param invocation MyBatis 침입 컨텍스트. args[0] 은 {@link MappedStatement}
     * @return 원본 실행 결과 그대로 반환(인터셉터는 결과를 변형하지 않음)
     * @throws Throwable 원본 실행 예외는 그대로 전파. finally 에서 MAPPER_INFO 를
     *                   반드시 remove 하여 스레드 풀 재사용 시 정보 누수를 차단
     */
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        String fullId = ms.getId();

        // FQ statement id 에서 마지막 두 세그먼트만 추출:
        // com.shopjoy.ecadminapi.mapper.mb.MbMemberMapper.selectPageList → MbMemberMapper.selectPageList
        int lastDot = fullId.lastIndexOf('.');
        int prevDot = fullId.lastIndexOf('.', lastDot - 1);
        String shortId = prevDot >= 0 ? fullId.substring(prevDot + 1) : fullId;

        MAPPER_INFO.set(shortId);
        try {
            Object result = invocation.proceed();
            RESULT_SUMMARY.set(buildResultSummary(result));
            return result;
        } finally {
            MAPPER_INFO.remove();
        }
    }

    /**
     * 실행 결과를 사람이 읽기 쉬운 요약 문자열로 변환한다(P6SpyFormatter 가 SQL 블록에 부착).
     *
     * @param result 실행 결과(List / Integer·Long(영향 행 수) / 단일 객체 / null)
     * @return List: "결과 N건" + 상위 {@link #PREVIEW_ROWS}건 미리보기.
     *         숫자: "영향 행 수: N". 단일 객체: 한 줄 포맷. null: null
     */
    private String buildResultSummary(Object result) {
        if (result instanceof List<?> list) {
            if (list.isEmpty()) return " ↳ 결과 0건";
            int total   = list.size();
            int preview = Math.min(PREVIEW_ROWS, total);
            StringBuilder sb = new StringBuilder();
            sb.append(String.format(" ↳ 결과 %d건%s",
                    total, total > PREVIEW_ROWS ? "  (상위 " + PREVIEW_ROWS + "건)" : ""));
            for (int i = 0; i < preview; i++) {
                sb.append(String.format("\n   [%d] %s", i + 1, formatRow(list.get(i))));
            }
            return sb.toString();
        }
        if (result instanceof Integer || result instanceof Long) {
            return " ↳ 영향 행 수: " + result;
        }
        if (result != null) {
            return " ↳ " + formatRow(result);
        }
        return null;
    }

    /**
     * 단일 행을 toString 으로 포맷하되 과도한 길이를 절단한다.
     *
     * @param row 행 객체(Map/엔티티 등, null 이면 "null")
     * @return toString 결과. 200자 초과 시 200자 + "…" 로 절단(로그 한 줄 가독성 유지)
     */
    private String formatRow(Object row) {
        if (row == null) return "null";
        String s = row.toString();
        return s.length() > 200 ? s.substring(0, 200) + "…" : s;
    }

    /**
     * 인터셉터를 대상에 적용한다.
     *
     * @param target 래핑 대상(Executor 등)
     * @return Executor 면 프록시로 래핑된 객체, 그 외는 원본(불필요한 프록시 방지)
     */
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    /**
     * 인터셉터 프로퍼티 주입 콜백. 사용하는 외부 설정이 없어 빈 구현이다.
     *
     * @param properties MyBatis 설정에서 전달되는 프로퍼티(미사용)
     */
    @Override
    public void setProperties(Properties properties) {}
}
