package com.shopjoy.ecadminapi.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;

import java.util.List;
import java.util.Properties;

@Slf4j
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}),
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class MyBatisQueryInterceptor implements Interceptor {

    private static final int PREVIEW_ROWS = 3;
    private static final ThreadLocal<String> MAPPER_INFO = new ThreadLocal<>();

    public static String getCurrentMapperInfo() {
        return MAPPER_INFO.get();
    }

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        String fullId = ms.getId();

        // e.g. com.shopjoy.ecadminapi.mapper.mb.MbMemberMapper.selectPageList
        //  → MbMemberMapper.selectPageList
        int lastDot = fullId.lastIndexOf('.');
        int prevDot = fullId.lastIndexOf('.', lastDot - 1);
        String shortId = prevDot >= 0 ? fullId.substring(prevDot + 1) : fullId;

        MAPPER_INFO.set(shortId);
        try {
            Object result = invocation.proceed();
            logResult(result);
            return result;
        } finally {
            MAPPER_INFO.remove();
        }
    }

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
