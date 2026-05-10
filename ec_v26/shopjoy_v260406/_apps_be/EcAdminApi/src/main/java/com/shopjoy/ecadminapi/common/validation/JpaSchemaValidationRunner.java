package com.shopjoy.ecadminapi.common.validation;

import jakarta.persistence.Column;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import jakarta.persistence.metamodel.EntityType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.lang.reflect.Field;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/**
 * JPA 스키마 전수 검증 러너.
 *
 * spring.profiles.active=validate 일 때만 활성화. 기존 Hibernate ddl-auto=validate 는
 * 첫 미스매치 발견 시 EntityManagerFactory 생성을 실패시켜 한 번에 한 컬럼만 보였다.
 *
 * 이 러너는 ddl-auto=none 환경에서 직접:
 *   1) Hibernate Metamodel 의 모든 @Entity 순회
 *   2) information_schema.columns 로 실제 DB 컬럼 정보 조회
 *   3) 컬럼 누락 / 타입 불일치 / 길이 불일치 를 한꺼번에 수집
 *   4) 모든 미스매치를 카테고리별로 정리해 콘솔 + 로그 출력
 *   5) JVM 종료
 *
 * 검증 통과(미스매치 0건) 시에만 ✅ 배너 출력.
 */
@Slf4j
@Component
@Profile("validate")
public class JpaSchemaValidationRunner implements ApplicationRunner {

    @PersistenceContext
    private EntityManager em;

    private final ApplicationContext ctx;
    private final Environment env;

    public JpaSchemaValidationRunner(ApplicationContext ctx, Environment env) {
        this.ctx = ctx;
        this.env = env;
    }

    /** run — 실행 */
    @Override
    public void run(ApplicationArguments args) {
        String schema = env.getProperty("spring.jpa.properties.hibernate.default_schema", "public");
        DataSource ds = ctx.getBean(DataSource.class);

        String dbUrl = "(unknown)";
        String dbUser = "(unknown)";
        Map<String, Map<String, DbColumn>> dbColumns;

        try (Connection conn = ds.getConnection()) {
            dbUrl = conn.getMetaData().getURL();
            dbUser = conn.getMetaData().getUserName();
            dbColumns = loadDbColumns(conn, schema);
        } catch (Exception e) {
            log.error("DB 연결/메타조회 실패", e);
            System.exit(1);
            return;
        }

        // 미스매치 분류
        List<String> missingTables = new ArrayList<>();
        List<String> missingColumns = new ArrayList<>();
        List<String> typeMismatches = new ArrayList<>();
        List<String> lengthMismatches = new ArrayList<>();
        int entityCount = 0;
        int columnsChecked = 0;

        for (EntityType<?> et : em.getMetamodel().getEntities()) {
            Class<?> javaType = et.getJavaType();
            if (javaType == null) continue;
            entityCount++;

            String tableName = resolveTableName(javaType);
            Map<String, DbColumn> dbCols = dbColumns.get(tableName.toLowerCase(Locale.ROOT));

            if (dbCols == null) {
                missingTables.add(String.format("%s  ← Entity: %s",
                        tableName, javaType.getSimpleName()));
                continue;
            }

            for (Field f : collectAllFields(javaType)) {
                Column colAnno = f.getAnnotation(Column.class);
                if (colAnno == null) continue;
                if (f.isAnnotationPresent(jakarta.persistence.Transient.class)) continue;

                String colName = (colAnno.name() == null || colAnno.name().isBlank())
                        ? toSnake(f.getName()) : colAnno.name();
                columnsChecked++;

                DbColumn dbCol = dbCols.get(colName.toLowerCase(Locale.ROOT));
                if (dbCol == null) {
                    missingColumns.add(String.format("%s.%s  ← Entity: %s.%s",
                            tableName, colName, javaType.getSimpleName(), f.getName()));
                    continue;
                }

                ExpectedType exp = expectedTypeOf(f, colAnno);
                String actualType = dbCol.dataType.toLowerCase(Locale.ROOT);

                if (!exp.matchesType(actualType)) {
                    typeMismatches.add(String.format("%s.%s  expected=%s  actual=%s  (Entity: %s.%s : %s)",
                            tableName, colName, exp.typeLabel(), actualType,
                            javaType.getSimpleName(), f.getName(), f.getType().getSimpleName()));
                    continue;
                }

                // 문자열 길이 검사
                if (exp.expectedLength > 0 && dbCol.charMaxLength != null
                        && dbCol.charMaxLength != exp.expectedLength) {
                    lengthMismatches.add(String.format("%s.%s  expected=%s(%d)  actual=%s(%d)  (Entity: %s.%s)",
                            tableName, colName, exp.typeLabel(), exp.expectedLength,
                            actualType, dbCol.charMaxLength,
                            javaType.getSimpleName(), f.getName()));
                }
            }
        }

        printReport(dbUrl, dbUser, schema, entityCount, columnsChecked,
                missingTables, missingColumns, typeMismatches, lengthMismatches);

        int totalIssues = missingTables.size() + missingColumns.size()
                + typeMismatches.size() + lengthMismatches.size();
        int exitCode = (totalIssues == 0) ? 0 : 2;
        SpringApplication.exit(ctx, () -> exitCode);
        System.exit(exitCode);
    }

    // ─────────────────────────────────────────────────────────────────
    // DB 메타 로드
    // ─────────────────────────────────────────────────────────────────
    private Map<String, Map<String, DbColumn>> loadDbColumns(Connection conn, String schema) throws Exception {
        Map<String, Map<String, DbColumn>> result = new HashMap<>();
        String sql = "SELECT table_name, column_name, data_type, character_maximum_length "
                   + "FROM information_schema.columns WHERE table_schema = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, schema);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String t = rs.getString(1).toLowerCase(Locale.ROOT);
                    String c = rs.getString(2).toLowerCase(Locale.ROOT);
                    String dt = rs.getString(3);
                    Integer len = (Integer) rs.getObject(4);
                    result.computeIfAbsent(t, k -> new HashMap<>())
                          .put(c, new DbColumn(dt, len));
                }
            }
        }
        return result;
    }

    /** resolveTableName — 결정 */
    private String resolveTableName(Class<?> entityClass) {
        Table t = entityClass.getAnnotation(Table.class);
        if (t != null && !t.name().isBlank()) return t.name();
        return toSnake(entityClass.getSimpleName());
    }

    /** collectAllFields — 수집 */
    private List<Field> collectAllFields(Class<?> cls) {
        List<Field> fields = new ArrayList<>();
        Class<?> c = cls;
        while (c != null && c != Object.class) {
            for (Field f : c.getDeclaredFields()) {
                if (java.lang.reflect.Modifier.isStatic(f.getModifiers())) continue;
                fields.add(f);
            }
            c = c.getSuperclass();
        }
        return fields;
    }

    /** toSnake — 변환 */
    private static String toSnake(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (Character.isUpperCase(ch) && i > 0) sb.append('_');
            sb.append(Character.toLowerCase(ch));
        }
        return sb.toString();
    }

    // ─────────────────────────────────────────────────────────────────
    // 타입 매칭
    // ─────────────────────────────────────────────────────────────────
    private static ExpectedType expectedTypeOf(Field f, Column anno) {
        Class<?> t = f.getType();
        // columnDefinition 우선
        String colDef = anno.columnDefinition() == null ? "" : anno.columnDefinition().trim().toLowerCase(Locale.ROOT);
        if (!colDef.isEmpty()) {
            if (colDef.startsWith("text"))   return ExpectedType.of("text", 0);
            if (colDef.startsWith("clob"))   return ExpectedType.of("text", 0);
            if (colDef.startsWith("bigint")) return ExpectedType.of("bigint", 0);
            if (colDef.startsWith("int"))    return ExpectedType.of("integer", 0);
            // VARCHAR(n) / CHAR(n)
            if (colDef.startsWith("varchar")) return ExpectedType.of("character varying", parseLen(colDef));
            if (colDef.startsWith("char"))    return ExpectedType.of("character", parseLen(colDef));
            if (colDef.startsWith("numeric") || colDef.startsWith("decimal"))
                return ExpectedType.of("numeric", 0);
            if (colDef.startsWith("timestamp")) return ExpectedType.of("timestamp without time zone", 0);
            if (colDef.startsWith("date"))      return ExpectedType.of("date", 0);
            if (colDef.startsWith("boolean") || colDef.startsWith("bool"))
                return ExpectedType.of("boolean", 0);
        }
        // Java type 기반
        if (t == String.class) {
            int len = anno.length();
            return ExpectedType.of("character varying", len > 0 ? len : 255);
        }
        if (t == Integer.class || t == int.class)   return ExpectedType.of("integer", 0);
        if (t == Long.class    || t == long.class)  return ExpectedType.of("bigint", 0);
        if (t == Short.class   || t == short.class) return ExpectedType.of("smallint", 0);
        if (t == Boolean.class || t == boolean.class) return ExpectedType.of("boolean", 0);
        if (t == java.math.BigDecimal.class)        return ExpectedType.of("numeric", 0);
        if (t == LocalDate.class)                   return ExpectedType.of("date", 0);
        if (t == LocalDateTime.class || t == java.util.Date.class)
            return ExpectedType.of("timestamp without time zone", 0);
        if (t == LocalTime.class)                   return ExpectedType.of("time without time zone", 0);
        if (t == byte[].class)                      return ExpectedType.of("bytea", 0);
        return ExpectedType.of("(unknown)", 0);
    }

    /** parseLen — 파싱 */
    private static int parseLen(String def) {
        int o = def.indexOf('('), c = def.indexOf(')');
        if (o < 0 || c < 0 || c <= o) return 0;
        try { return Integer.parseInt(def.substring(o + 1, c).split(",")[0].trim()); }
        catch (Exception e) { return 0; }
    }

    /** DbColumn */
    private record DbColumn(String dataType, Integer charMaxLength) { }

    private static class ExpectedType {
        final String pgType;
        final int expectedLength;
        ExpectedType(String pgType, int expectedLength) {
            this.pgType = pgType;
            this.expectedLength = expectedLength;
        }
        static ExpectedType of(String t, int len) { return new ExpectedType(t, len); }

        boolean matchesType(String actualPgType) {
            if (pgType.equals("(unknown)")) return true;  // 알 수 없으면 통과
            // pg는 character varying ↔ varchar 동의어, character ↔ char 동의어
            if (pgType.equals("character varying") &&
                (actualPgType.equals("character varying") || actualPgType.equals("varchar"))) return true;
            if (pgType.equals("character") &&
                (actualPgType.equals("character") || actualPgType.equals("char")
                 || actualPgType.equals("bpchar"))) return true;
            return pgType.equals(actualPgType);
        }
        String typeLabel() { return pgType; }
    }

    // ─────────────────────────────────────────────────────────────────
    // 리포트 출력
    // ─────────────────────────────────────────────────────────────────
    private void printReport(String dbUrl, String dbUser, String schema,
                             int entityCount, int columnsChecked,
                             List<String> missingTables, List<String> missingColumns,
                             List<String> typeMismatches, List<String> lengthMismatches) {
        String bar = "════════════════════════════════════════════════════════════════════════";
        StringBuilder sb = new StringBuilder();
        sb.append('\n').append(bar).append('\n');

        int total = missingTables.size() + missingColumns.size()
                  + typeMismatches.size() + lengthMismatches.size();

        if (total == 0) {
            sb.append("✅ JPA 스키마 검증 통과 (전수 검사)\n");
        } else {
            sb.append("❌ JPA 스키마 미스매치 ").append(total).append("건 발견\n");
        }
        sb.append("   - DB URL    : ").append(dbUrl).append('\n');
        sb.append("   - DB User   : ").append(dbUser).append('\n');
        sb.append("   - Schema    : ").append(schema).append('\n');
        sb.append("   - Entity 수 : ").append(entityCount).append(" 개\n");
        sb.append("   - 컬럼 검사 : ").append(columnsChecked).append(" 건\n");
        sb.append('\n');

        appendSection(sb, "[1] 누락 테이블 (Entity 는 있지만 DB 테이블 없음)", missingTables);
        appendSection(sb, "[2] 누락 컬럼   (Entity 필드 있지만 DB 컬럼 없음)", missingColumns);
        appendSection(sb, "[3] 타입 불일치 (DB 컬럼 타입 ≠ Entity 매핑 타입)", typeMismatches);
        appendSection(sb, "[4] 길이 불일치 (VARCHAR 길이 ≠)",                lengthMismatches);

        if (total == 0) {
            sb.append("   ▶ 모든 @Entity 가 DB 컬럼/타입과 일치합니다.\n");
        } else {
            sb.append("   ▶ 위 미스매치를 정리하는 마이그레이션 SQL 작성 후 재실행하세요.\n");
        }
        sb.append(bar).append('\n');

        // 콘솔 직접 출력 (logback 패턴/필터 무관)
        System.out.println(sb);
        System.out.flush();

        // 로그도 같이 (파일 보관용)
        if (total == 0) log.info("\n{}", sb);
        else            log.warn("\n{}", sb);
    }

    /** appendSection — 추가 */
    private static void appendSection(StringBuilder sb, String title, List<String> items) {
        sb.append("── ").append(title).append(" : ").append(items.size()).append("건\n");
        if (items.isEmpty()) {
            sb.append("    (없음)\n");
        } else {
            // 테이블별로 그룹화하면 보기 편함
            Map<String, List<String>> byTable = new TreeMap<>();
            for (String line : items) {
                String tbl = line.split("[. ]")[0];
                byTable.computeIfAbsent(tbl, k -> new ArrayList<>()).add(line);
            }
            for (Map.Entry<String, List<String>> e : byTable.entrySet()) {
                for (String line : e.getValue()) {
                    sb.append("    · ").append(line).append('\n');
                }
            }
        }
        sb.append('\n');
    }
}
