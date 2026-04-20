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

        String mapperInfo = MyBatisQueryInterceptor.getCurrentMapperInfo();
        String header = mapperInfo != null
                ? String.format("▶ %s  [%dms]", mapperInfo, elapsed)
                : String.format("▶ [%dms]", elapsed);

        return "\n┌─────────────────────────────────────────────────────\n"
                + "│ " + header + "\n"
                + "│ SQL:\n"
                + formatSql(sql)
                + "\n└─────────────────────────────────────────────────────";
    }

    /** SQL 키워드 앞에 줄바꿈을 삽입하고 각 줄에 │ 프리픽스를 붙여 가독성을 높인다. */
    private String formatSql(String sql) {
        String formatted = sql.trim()
                .replaceAll("(?i)\\b(SELECT)\\b", "\n    SELECT")
                .replaceAll("(?i)\\b(FROM)\\b", "\n    FROM")
                .replaceAll("(?i)\\b(LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN)\\b", "\n        $1")
                .replaceAll("(?i)\\b(WHERE)\\b", "\n    WHERE")
                .replaceAll("(?i)\\b(AND|OR)\\b", "\n        $1")
                .replaceAll("(?i)\\b(ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET)\\b", "\n    $1")
                .replaceAll("(?i)\\b(INSERT INTO|UPDATE|DELETE FROM|SET|VALUES)\\b", "\n    $1");
        StringBuilder sb = new StringBuilder();
        for (String line : formatted.split("\n")) {
            if (!line.isBlank()) sb.append("│   ").append(line.trim()).append("\n");
        }
        return sb.toString().stripTrailing();
    }
}
