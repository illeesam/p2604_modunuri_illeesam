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
    private static final ThreadLocal<String> MAPPER_INFO = new ThreadLocal<>();

    /** P6SpyFormatter에서 호출 — 현재 실행 중인 Mapper.메서드명 반환 */
    public static String getCurrentMapperInfo() {
        return MAPPER_INFO.get();
    }

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
            logResult(result);
            return result;
        } finally {
            MAPPER_INFO.remove(); // 스레드 풀 재사용 시 이전 값 유출 방지
        }
    }

    /** 결과가 List인 경우에만 건수 및 상위 N건 미리보기를 로깅한다. */
    private void logResult(Object result) {
        if (!(result instanceof List<?> list) || list.isEmpty()) return;

        int total = list.size();
        int preview = Math.min(PREVIEW_ROWS, total);
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("│ ↳ 결과 %d건%s\n",
                total, total > PREVIEW_ROWS ? "  (상위 " + PREVIEW_ROWS + "건 미리보기)" : ""));
        for (int i = 0; i < preview; i++) {
            sb.append(String.format("│   [%d] %s\n", i + 1, list.get(i)));
        }
        log.debug("\n{}", sb.toString().stripTrailing());
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {}
}
