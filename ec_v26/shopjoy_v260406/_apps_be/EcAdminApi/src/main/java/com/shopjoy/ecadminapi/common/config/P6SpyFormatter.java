package com.shopjoy.ecadminapi.common.config;

import com.p6spy.engine.spy.appender.MessageFormattingStrategy;

import java.util.ArrayList;
import java.util.List;

/**
 * P6Spy SQL 로그 포맷터 (local/dev 전용).
 *
 * spy.properties의 logMessageFormat에 이 클래스를 지정하면
 * 실제 바인딩 값이 치환된 SQL을 구조화된 형태로 출력한다.
 *
 * 지원: SELECT/INSERT/UPDATE/DELETE/CTE(WITH RECURSIVE)/UNION ALL/서브쿼리.
 * 괄호 깊이에 따라 들여쓰기 단계가 자동 증가.
 */
public class P6SpyFormatter implements MessageFormattingStrategy {

    /** 단계별 들여쓰기 한 칸 */
    private static final String INDENT = "    ";

    /** 절(clause) 키워드 — 새 줄 + 절 수준 들여쓰기 (괄호 깊이의 1단계 더) */
    private static final String[] CLAUSE_KW = {
        "SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY",
        "LIMIT", "OFFSET", "VALUES", "SET", "RETURNING"
    };
    /** AND/OR — 새 줄 + 절보다 한 단계 더 들여쓰기 */
    private static final String[] LOGIC_KW = {"AND", "OR"};
    /** JOIN 변형 */
    private static final String[] JOIN_KW = {
        "LEFT OUTER JOIN", "LEFT JOIN", "RIGHT OUTER JOIN", "RIGHT JOIN",
        "INNER JOIN", "CROSS JOIN", "JOIN"
    };
    /** ON */
    private static final String[] ON_KW = {"ON"};
    /** UNION 류 — 새 줄, 들여쓰기 0 (현재 깊이 기준) */
    private static final String[] UNION_KW = {"UNION ALL", "UNION", "INTERSECT", "EXCEPT"};

    @Override
    public String formatMessage(int connectionId, String now, long elapsed,
                                String category, String prepared, String sql, String url) {
        String effectiveSql = (sql != null && !sql.isBlank()) ? sql : prepared;
        if (effectiveSql == null || effectiveSql.isBlank()) return "";

        String mapperInfo    = MyBatisQueryInterceptor.getCurrentMapperInfo();
        String resultSummary = MyBatisQueryInterceptor.pollResultSummary();

        String header = mapperInfo != null
                ? String.format("▶ %s  [%dms]", mapperInfo, elapsed)
                : String.format("▶ [%dms]", elapsed);

        StringBuilder sb = new StringBuilder();
        sb.append("\n┌─────────────────────────────────────────────────────\n");
        sb.append(" ").append(header).append("\n");
        sb.append(" SQL:\n");
        sb.append(formatSql(effectiveSql));
        if (resultSummary != null) {
            sb.append("\n");
            sb.append("\n").append(resultSummary);
        }
        sb.append("\n└─────────────────────────────────────────────────────");
        return sb.toString();
    }

    /**
     * SQL 포맷 — 단일 라인으로 정규화 후 괄호 깊이를 추적하며 키워드 위치에 줄바꿈 + 들여쓰기 삽입.
     */
    private String formatSql(String sql) {
        /* 1) 공백 정규화 — 모든 공백/줄바꿈을 단일 스페이스로 */
        String s = sql.replaceAll("\\s+", " ").trim();

        /* 2) 토큰 단위로 순회하며 키워드 위치에 줄바꿈 삽입.
         *    문자열 리터럴('...') 내부의 키워드는 건드리지 않음. */
        List<Segment> segs = tokenize(s);

        StringBuilder out = new StringBuilder();
        int depth = 0;        // 괄호 깊이
        boolean atLineStart = true;
        // SELECT 컬럼 모드: SELECT~FROM 사이에서 depth 동일한 콤마는 줄바꿈
        boolean selectColumnMode = false;
        int selectColumnDepth = -1;

        for (int i = 0; i < segs.size(); i++) {
            Segment seg = segs.get(i);

            if (seg.type == Type.OPEN_PAREN) {
                out.append('(');
                depth++;
                atLineStart = false;
                continue;
            }
            if (seg.type == Type.CLOSE_PAREN) {
                depth--;
                if (selectColumnMode && depth < selectColumnDepth) {
                    selectColumnMode = false;
                }
                /* 절(SELECT 컬럼/AND/OR 등) 직후 줄바꿈된 ')' 면 들여쓰기 정렬 */
                int len = out.length();
                if (len > 0 && out.charAt(len - 1) == ' ') {
                    // 직전 공백 제거 후 닫음
                    out.setLength(len - 1);
                }
                out.append(')');
                atLineStart = false;
                continue;
            }
            if (seg.type == Type.COMMA) {
                /* SELECT 컬럼 모드 + 현재 depth == 컬럼 시작 depth → 줄바꿈 */
                if (selectColumnMode && depth == selectColumnDepth) {
                    out.append(',');
                    newline(out, depth + 2);  // 컬럼은 SELECT 보다 한 단계 깊게
                    atLineStart = true;
                } else {
                    out.append(", ");
                    atLineStart = false;
                }
                continue;
            }
            if (seg.type == Type.STRING) {
                out.append(seg.text);
                atLineStart = false;
                continue;
            }

            // WORD / KEYWORD
            String w = seg.text;
            String upper = w.toUpperCase();

            /* CTE 시작 */
            if (upper.equals("WITH") || upper.equals("WITH RECURSIVE")) {
                if (out.length() > 0) newline(out, depth);
                out.append(w);
                atLineStart = false;
                continue;
            }

            /* UNION 류 — 들여쓰기 0 (현재 depth) */
            if (matchesAny(upper, UNION_KW, segs, i)) {
                String matched = takeMultiWord(segs, i, UNION_KW);
                newline(out, depth);
                out.append(matched.toUpperCase());
                newline(out, depth);
                i += wordCount(matched) - 1;
                atLineStart = true;
                selectColumnMode = false;
                continue;
            }

            /* JOIN 변형 */
            if (matchesAny(upper, JOIN_KW, segs, i)) {
                String matched = takeMultiWord(segs, i, JOIN_KW);
                newline(out, depth + 2);
                out.append(matched.toUpperCase()).append(' ');
                i += wordCount(matched) - 1;
                atLineStart = false;
                selectColumnMode = false;
                continue;
            }

            /* ON — JOIN 직후 조건 */
            if (upper.equals("ON")) {
                newline(out, depth + 3);
                out.append("ON ");
                atLineStart = false;
                continue;
            }

            /* 절 키워드 — SELECT / FROM / WHERE / ... */
            if (matchesAny(upper, CLAUSE_KW, segs, i)) {
                String matched = takeMultiWord(segs, i, CLAUSE_KW);
                String mUpper = matched.toUpperCase();
                newline(out, depth + 1);
                out.append(mUpper);
                if (mUpper.equals("SELECT")) {
                    /* SELECT 컬럼 모드 진입 — 다음 토큰을 새 줄에 */
                    newline(out, depth + 2);
                    selectColumnMode = true;
                    selectColumnDepth = depth;
                } else {
                    out.append(' ');
                    selectColumnMode = false;
                }
                i += wordCount(matched) - 1;
                atLineStart = (mUpper.equals("SELECT"));
                continue;
            }

            /* AND / OR */
            if (matchesAny(upper, LOGIC_KW, segs, i)) {
                newline(out, depth + 2);
                out.append(upper).append(' ');
                atLineStart = false;
                continue;
            }

            /* UPDATE / INSERT INTO / DELETE FROM — 첫 키워드 */
            if (upper.equals("UPDATE") || (upper.equals("INSERT") && peekIs(segs, i + 1, "INTO"))
                    || (upper.equals("DELETE") && peekIs(segs, i + 1, "FROM"))) {
                if (out.length() > 0) newline(out, depth);
                if (upper.equals("INSERT")) { out.append("INSERT INTO "); i++; }
                else if (upper.equals("DELETE")) { out.append("DELETE FROM "); i++; }
                else { out.append(upper).append(' '); }
                atLineStart = false;
                continue;
            }

            /* AS — 공백 유지 */
            if (upper.equals("AS")) {
                out.append(" AS ");
                atLineStart = false;
                continue;
            }

            /* 일반 단어 */
            if (!atLineStart && out.length() > 0 && out.charAt(out.length() - 1) != ' '
                    && out.charAt(out.length() - 1) != '(' && out.charAt(out.length() - 1) != '\n') {
                out.append(' ');
            }
            out.append(w);
            atLineStart = false;
        }

        /* 3) 줄 단위 정리 — 빈 줄 제거 + 좌측에 3칸 추가 */
        StringBuilder sb = new StringBuilder();
        for (String line : out.toString().split("\n")) {
            if (line.replaceAll("\\s", "").isEmpty()) continue;
            // 좌측 trailing 공백 제거하지 않고 그대로 + 3칸 외부 들여쓰기
            sb.append("   ").append(line).append("\n");
        }
        return sb.toString().stripTrailing();
    }

    /* ── 토큰화 — 단어/문자열리터럴/괄호/콤마 분리 ─────────── */
    private enum Type { WORD, STRING, OPEN_PAREN, CLOSE_PAREN, COMMA }
    private static class Segment { Type type; String text; Segment(Type t, String x) { type = t; text = x; } }

    private List<Segment> tokenize(String sql) {
        List<Segment> out = new ArrayList<>();
        int i = 0, n = sql.length();
        StringBuilder buf = new StringBuilder();
        while (i < n) {
            char c = sql.charAt(i);
            /* 블록 주석 — /* ... *​/ 를 통째로 한 WORD 토큰으로 보존 (내부 공백 유지) */
            if (c == '/' && i + 1 < n && sql.charAt(i + 1) == '*') {
                flushWord(buf, out);
                int start = i;
                i += 2;
                while (i + 1 < n && !(sql.charAt(i) == '*' && sql.charAt(i + 1) == '/')) i++;
                if (i + 1 < n) i += 2; // *​/ 까지 포함
                out.add(new Segment(Type.WORD, sql.substring(start, i)));
                continue;
            }
            if (c == '\'') {
                // 문자열 리터럴 — '' 이스케이프 처리
                flushWord(buf, out);
                int start = i;
                i++;
                while (i < n) {
                    if (sql.charAt(i) == '\'' && i + 1 < n && sql.charAt(i + 1) == '\'') { i += 2; continue; }
                    if (sql.charAt(i) == '\'') { i++; break; }
                    i++;
                }
                out.add(new Segment(Type.STRING, sql.substring(start, i)));
                continue;
            }
            if (c == '(') { flushWord(buf, out); out.add(new Segment(Type.OPEN_PAREN, "(")); i++; continue; }
            if (c == ')') { flushWord(buf, out); out.add(new Segment(Type.CLOSE_PAREN, ")")); i++; continue; }
            if (c == ',') { flushWord(buf, out); out.add(new Segment(Type.COMMA, ",")); i++; continue; }
            if (c == ' ') { flushWord(buf, out); i++; continue; }
            buf.append(c);
            i++;
        }
        flushWord(buf, out);
        return out;
    }

    private void flushWord(StringBuilder buf, List<Segment> out) {
        if (buf.length() > 0) {
            out.add(new Segment(Type.WORD, buf.toString()));
            buf.setLength(0);
        }
    }

    /* ── 키워드 매칭 헬퍼 ──────────────────────────────────── */

    /** segs[i] 부터 시작해서 keywords 중 하나(다중 단어 가능)와 일치하는지 검사 */
    private boolean matchesAny(String currentUpper, String[] keywords, List<Segment> segs, int i) {
        return takeMultiWord(segs, i, keywords) != null;
    }

    /** segs[i] 부터 시작해서 multi-word 키워드 매칭 시 매칭 문자열 반환, 없으면 null */
    private String takeMultiWord(List<Segment> segs, int i, String[] keywords) {
        if (i >= segs.size() || segs.get(i).type != Type.WORD) return null;
        // 가능한 후보들을 길이 내림차순으로 검사 (LEFT OUTER JOIN > LEFT JOIN)
        for (String kw : keywords) {
            String[] parts = kw.split("\\s+");
            if (i + parts.length > segs.size()) continue;
            boolean ok = true;
            for (int k = 0; k < parts.length; k++) {
                Segment s = segs.get(i + k);
                if (s.type != Type.WORD || !s.text.equalsIgnoreCase(parts[k])) { ok = false; break; }
            }
            if (ok) return kw;
        }
        return null;
    }

    private int wordCount(String s) { return s.split("\\s+").length; }

    private boolean peekIs(List<Segment> segs, int i, String upper) {
        if (i >= segs.size()) return false;
        Segment s = segs.get(i);
        return s.type == Type.WORD && s.text.equalsIgnoreCase(upper);
    }

    /** 새 줄 + 들여쓰기(N단계) */
    private void newline(StringBuilder sb, int level) {
        if (sb.length() > 0 && sb.charAt(sb.length() - 1) == ' ') sb.setLength(sb.length() - 1);
        sb.append('\n');
        for (int i = 0; i < level; i++) sb.append(INDENT);
    }
}
