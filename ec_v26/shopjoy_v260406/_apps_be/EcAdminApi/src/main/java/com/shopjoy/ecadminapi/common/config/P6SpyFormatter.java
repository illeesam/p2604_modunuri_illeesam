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

    /**
     * P6Spy 가 호출하는 로그 메시지 포맷 콜백. 바인딩 치환된 SQL 을 박스 형태로 정형화한다.
     *
     * <p>{@code sql}(바인딩 치환 완료본)을 우선 사용하고, 비어 있으면 {@code prepared}(?
     * 플레이스홀더 원형)로 폴백한다. {@link MyBatisQueryInterceptor} 가 ThreadLocal 에 남긴
     * 매퍼 정보·결과 요약을 헤더/푸터에 결합한다.</p>
     *
     * @param connectionId 커넥션 ID(미사용)
     * @param now          타임스탬프 문자열(미사용)
     * @param elapsed      실행 소요 시간(ms) — 헤더에 표시
     * @param category     statement 카테고리(미사용)
     * @param prepared     플레이스홀더 원형 SQL(폴백용)
     * @param sql          바인딩 치환된 실행 SQL(우선)
     * @param url          JDBC URL(미사용)
     * @return 박스 정형화된 로그 문자열. sql·prepared 모두 비면 빈 문자열(빈 로그 라인 억제)
     */
    @Override
    public String formatMessage(int connectionId, String now, long elapsed,
                                String category, String prepared, String sql, String url) {
        String effectiveSql = (sql != null && !sql.isBlank()) ? sql : prepared;
        if (effectiveSql == null || effectiveSql.isBlank()) return "";
        sql = effectiveSql;

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

    /**
     * SQL 주요 절 키워드 앞에 줄바꿈/들여쓰기를 삽입해 가독성을 높인다.
     *
     * <p>SELECT 컬럼 목록을 먼저 분리한 뒤, FROM/JOIN/ON/WHERE/AND/OR/GROUP BY/HAVING/
     * ORDER BY/LIMIT/OFFSET/INSERT INTO/VALUES/UPDATE/SET/DELETE FROM 키워드를 정규식
     * {@code (?i)\b키워드\b}(대소문자 무시·단어 경계)로 찾아 들여쓴다.</p>
     *
     * @param sql 원본 SQL(trim 후 처리)
     * @return 각 줄을 trim 하고 3칸 들여쓴 정형 SQL. 빈 줄은 제거
     */
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
     * {@code SELECT col1,col2,... FROM ...} 에서 컬럼 목록을 한 줄씩 분리한다.
     *
     * <p>정규식 {@code (?i)^(SELECT\s+)(.*?)(\s+FROM\b)} 으로 SELECT~FROM 사이를 비탐욕
     * 캡처한다. 함수 인자의 쉼표를 컬럼 구분자로 오인하지 않도록 괄호 깊이(depth)를 추적해
     * depth==0 인 최상위 쉼표에서만 분리한다.</p>
     *
     * @param sql 원본 SQL
     * @return 컬럼이 줄 단위로 펼쳐진 SQL. SELECT~FROM 패턴 불일치 시
     *         (서브쿼리·비SELECT 등) SELECT 한 줄 + 본문 형태로 폴백
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
