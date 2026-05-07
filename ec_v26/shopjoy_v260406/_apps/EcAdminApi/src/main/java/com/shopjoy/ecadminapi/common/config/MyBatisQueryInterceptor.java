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
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class MyBatisQueryInterceptor implements Interceptor {

    private static final int PREVIEW_ROWS = 3;

    /** P6SpyFormatter가 읽는 현재 Mapper 정보 (스레드 로컬) */
    private static final ThreadLocal<String>  MAPPER_INFO    = new ThreadLocal<>();
    /** P6SpyFormatter가 읽는 쿼리 결과 요약 (스레드 로컬) */
    private static final ThreadLocal<String>  RESULT_SUMMARY = new ThreadLocal<>();

    /** P6SpyFormatter에서 호출 — 현재 실행 중인 Mapper.메서드명 반환 */
    public static String getCurrentMapperInfo() { return MAPPER_INFO.get(); }

    /** P6SpyFormatter에서 호출 — 결과 요약 문자열 반환 후 즉시 제거 */
    public static String pollResultSummary() {
        String s = RESULT_SUMMARY.get();
        RESULT_SUMMARY.remove();
        return s;
    }

    /** intercept */
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        String fullId = ms.getId();

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

    /** 결과를 요약 문자열로 변환 — P6SpyFormatter 가 SQL 블록 안에 포함해 출력 */
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

    /** 단일 행 포맷 — Map/객체 모두 toString, 길면 잘라냄 */
    private String formatRow(Object row) {
        if (row == null) return "null";
        String s = row.toString();
        return s.length() > 200 ? s.substring(0, 200) + "…" : s;
    }

    /** plugin */
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    /** setProperties — 설정 */
    @Override
    public void setProperties(Properties properties) {}
}
