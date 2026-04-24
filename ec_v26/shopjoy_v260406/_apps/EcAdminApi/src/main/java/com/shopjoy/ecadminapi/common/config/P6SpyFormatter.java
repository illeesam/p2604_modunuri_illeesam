package com.shopjoy.ecadminapi.common.config;

import com.p6spy.engine.spy.appender.MessageFormattingStrategy;

/**
 * P6Spy SQL 로그 포맷터 (local/dev 전용).
 *
 * spy.properties의 logMessageFormat에 이 클래스를 지정하면
 * 실제 바인딩 값이 치환된 SQL을 구조화된 형태로 출력한다.
 *
 * MyBatisQueryInterceptor와 연동해 SQL 헤더에 Mapper 메서드명과 실행 시간을 표시.
 * 출력 예시:
 *   ┌──────────────────────────────────────────
 *   │ ▶ MbMemberMapper.selectPageList  [12ms]
 *   │ SQL:
 *   │   SELECT ...
 *   │   FROM mb_member
 *   │   WHERE use_yn = 'Y'
 *   └──────────────────────────────────────────
 */
public class P6SpyFormatter implements MessageFormattingStrategy {

    @Override
    public String formatMessage(int connectionId, String now, long elapsed,
                                String category, String prepared, String sql, String url) {
        if (sql == null || sql.isBlank()) return "";

        String mapperInfo    = MyBatisQueryInterceptor.getCurrentMapperInfo();
        String resultSummary = MyBatisQueryInterceptor.pollResultSummary();

        String header = mapperInfo != null
                ? String.format("▶ %s  [%dms]", mapperInfo, elapsed)
                : String.format("▶ [%dms]", elapsed);

        StringBuilder sb = new StringBuilder();
        sb.append("\n┌─────────────────────────────────────────────────────\n");
        sb.append(" ").append(header).append("\n");
        sb.append(" SQL:\n");
        sb.append(formatSql(sql));
        if (resultSummary != null) {
            sb.append("\n");
            sb.append("\n").append(resultSummary);
        }
        sb.append("\n└─────────────────────────────────────────────────────");
        return sb.toString();
    }

    /** SQL 키워드 앞에 줄바꿈을 삽입하고 각 줄에 │ 프리픽스를 붙여 가독성을 높인다. */
    private String formatSql(String sql) {
        String s = sql.trim();

        // SELECT 컬럼 목록을 한 줄씩 분리 (FROM 이전까지)
        s = splitSelectColumns(s);

        // 주요 절 키워드 앞 줄바꿈
        s = s.replaceAll("(?i)\\b(FROM)\\b",                              "\n    FROM")
             .replaceAll("(?i)\\b(LEFT OUTER JOIN|LEFT JOIN|RIGHT OUTER JOIN|RIGHT JOIN|INNER JOIN|CROSS JOIN|JOIN)\\b", "\n        $1")
             .replaceAll("(?i)\\b(ON)\\b",                                "\n            ON")
             .replaceAll("(?i)\\b(WHERE)\\b",                             "\n    WHERE")
             .replaceAll("(?i)\\b(AND)\\b",                               "\n        AND")
             .replaceAll("(?i)\\b(OR)\\b",                                "\n        OR")
             .replaceAll("(?i)\\b(GROUP BY)\\b",                          "\n    GROUP BY")
             .replaceAll("(?i)\\b(HAVING)\\b",                            "\n    HAVING")
             .replaceAll("(?i)\\b(ORDER BY)\\b",                          "\n    ORDER BY")
             .replaceAll("(?i)\\b(LIMIT)\\b",                             "\n    LIMIT")
             .replaceAll("(?i)\\b(OFFSET)\\b",                            "\n    OFFSET")
             .replaceAll("(?i)\\b(INSERT INTO)\\b",                       "\n    INSERT INTO")
             .replaceAll("(?i)\\b(VALUES)\\b",                            "\n    VALUES")
             .replaceAll("(?i)^\\s*(UPDATE)\\b",                          "\n    UPDATE")
             .replaceAll("(?i)\\b(SET)\\b",                               "\n    SET")
             .replaceAll("(?i)\\b(DELETE FROM)\\b",                       "\n    DELETE FROM");

        StringBuilder sb = new StringBuilder();
        for (String line : s.split("\n")) {
            if (!line.isBlank()) sb.append("   ").append(line.trim()).append("\n");
        }
        return sb.toString().stripTrailing();
    }

    /**
     * SELECT col1,col2,col3 FROM ... 형태에서
     * 컬럼 목록을 한 줄씩 분리한다.
     * SELECT col1,
     *        col2,
     *        col3
     */
    private String splitSelectColumns(String sql) {
        // SELECT ~ FROM 사이의 컬럼 목록 추출
        java.util.regex.Matcher m = java.util.regex.Pattern
            .compile("(?i)^(SELECT\\s+)(.*?)(\\s+FROM\\b)")
            .matcher(sql);
        if (!m.find()) return "\n    SELECT\n        " + sql;

        String prefix  = m.group(1).trim();   // SELECT
        String columns = m.group(2).trim();   // col1,col2,...
        String rest    = sql.substring(m.end(1) + m.group(2).length()); // FROM ...

        // 쉼표 기준 분리 (괄호 안의 쉼표는 보호)
        StringBuilder cols = new StringBuilder();
        int depth = 0;
        int start = 0;
        boolean first = true;
        for (int i = 0; i < columns.length(); i++) {
            char c = columns.charAt(i);
            if (c == '(') depth++;
            else if (c == ')') depth--;
            else if (c == ',' && depth == 0) {
                String col = columns.substring(start, i).trim();
                cols.append(first ? "\n        " : ",\n        ").append(col);
                start = i + 1;
                first = false;
            }
        }
        // 마지막 컬럼
        String lastCol = columns.substring(start).trim();
        cols.append(first ? "\n        " : ",\n        ").append(lastCol);

        return "\n    " + prefix + cols + rest;
    }
}
