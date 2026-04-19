package com.shopjoy.ecadminapi.config;

import com.p6spy.engine.spy.appender.MessageFormattingStrategy;

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

    private String formatSql(String sql) {
        String formatted = sql.trim()
                .replaceAll("(?i)\\b(SELECT)\\b", "\n    SELECT")
                .replaceAll("(?i)\\b(FROM)\\b", "\n    FROM")
                .replaceAll("(?i)\\b(LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN)\\b", "\n        $1")
                .replaceAll("(?i)\\b(WHERE)\\b", "\n    WHERE")
                .replaceAll("(?i)\\b(AND|OR)\\b", "\n        $1")
                .replaceAll("(?i)\\b(ORDER BY|GROUP BY|HAVING|LIMIT|OFFSET)\\b", "\n    $1")
                .replaceAll("(?i)\\b(INSERT INTO|UPDATE|DELETE FROM|SET|VALUES)\\b", "\n    $1");
        // Prefix each line with │
        StringBuilder sb = new StringBuilder();
        for (String line : formatted.split("\n")) {
            if (!line.isBlank()) sb.append("│   ").append(line.trim()).append("\n");
        }
        return sb.toString().stripTrailing();
    }
}
