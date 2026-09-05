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

    /** Hibernate Metamodel(@Entity 목록) 조회용 EntityManager. */
    @PersistenceContext
    private EntityManager em;

    /** DataSource 빈 조회 및 종료 코드 반영용 Spring 컨텍스트. */
    private final ApplicationContext ctx;

    /** default_schema 등 설정값 조회용 환경. */
    private final Environment env;

    /**
     * 의존성 주입 생성자.
     *
     * @param ctx DataSource·종료 처리에 사용할 Spring 컨텍스트
     * @param env 스키마명 등 프로퍼티 조회용 환경
     */
    public JpaSchemaValidationRunner(ApplicationContext ctx, Environment env) {
        this.ctx = ctx;
        this.env = env;
    }

    /**
     * 앱 기동 직후(validate 프로파일) 1회 실행되는 스키마 전수 검증 엔트리.
     *
     * <p>흐름: DB 커넥션 확보 → information_schema 컬럼 메타 로드 → 모든 @Entity 순회하며
     * 누락 테이블/누락 컬럼/타입 불일치/길이 불일치 4종 수집 → 리포트 출력 →
     * 미스매치 0건이면 종료코드 0, 아니면 2 로 JVM 종료. DB 연결 실패 시 종료코드 1.
     * 검증 전용 러너이므로 정상 케이스에도 항상 프로세스를 종료시킨다(서버로 살아남지 않음).</p>
     *
     * @param args 사용하지 않음 (ApplicationRunner 계약상 존재)
     */
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
    /**
     * 지정 스키마의 모든 컬럼 메타정보를 information_schema.columns 에서 로드한다.
     *
     * @param conn   DB 커넥션
     * @param schema 대상 스키마명 (예: shopjoy_2604)
     * @return {테이블명(소문자) → {컬럼명(소문자) → DbColumn}} 중첩 맵
     * @throws Exception 쿼리 실행 실패 시
     */
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

    /**
     * Entity 클래스의 실제 DB 테이블명을 결정한다.
     *
     * <p>{@code @Table(name=...)} 이 지정돼 있으면 그 값을, 없으면 클래스 단순명을
     * snake_case 로 변환해 사용한다.</p>
     *
     * @param entityClass JPA Entity 클래스
     * @return 매핑 테이블명
     */
    private String resolveTableName(Class<?> entityClass) {
        Table t = entityClass.getAnnotation(Table.class);
        if (t != null && !t.name().isBlank()) return t.name();
        return toSnake(entityClass.getSimpleName());
    }

    /**
     * 클래스 계층 전체(상속 포함)의 인스턴스 필드를 수집한다.
     *
     * <p>{@code Object} 직전까지 슈퍼클래스를 거슬러 올라가며 선언 필드를 모으되
     * static 필드는 제외한다. 공통 부모 Entity 의 감사 컬럼(regDate 등)도
     * 검증 대상에 포함하기 위함이다.</p>
     *
     * @param cls 시작 Entity 클래스
     * @return 상속 포함 비-static 필드 목록
     */
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

    /**
     * camelCase/PascalCase 문자열을 snake_case 로 변환한다.
     *
     * <p>두 번째 글자부터 대문자 앞에 '_' 를 넣고 전체를 소문자화한다.
     * (예: {@code MbMember} → {@code mb_member}, {@code regDate} → {@code reg_date})</p>
     *
     * @param s 원본 식별자
     * @return snake_case 변환 결과
     */
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
    /**
     * Entity 필드에 기대되는 PostgreSQL 타입(+길이)을 산출한다.
     *
     * <p>우선순위: {@code @Column(columnDefinition=...)} 이 있으면 그 정의를 파싱(text/clob,
     * bigint/int, varchar(n)/char(n), numeric/decimal, timestamp, date, boolean).
     * 없으면 Java 타입으로 매핑(String→character varying(@Column.length 또는 255),
     * Integer→integer, Long→bigint, BigDecimal→numeric, LocalDate→date,
     * LocalDateTime/Date→timestamp without time zone, LocalTime→time, byte[]→bytea).
     * 매핑 불가 시 "(unknown)" — 이 경우 타입 검사는 무조건 통과 처리된다.</p>
     *
     * @param f    검사 대상 Entity 필드
     * @param anno 필드의 @Column 메타
     * @return 기대 타입/길이를 담은 ExpectedType
     */
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

    /**
     * {@code varchar(100)} 같은 columnDefinition 에서 길이 숫자만 추출한다.
     *
     * <p>괄호가 없거나 파싱 실패 시 0 을 반환한다. {@code numeric(10,2)} 처럼
     * 콤마가 있으면 첫 번째 값(정밀도)만 취한다.</p>
     *
     * @param def 소문자화된 컬럼 정의 문자열
     * @return 추출 길이, 실패 시 0
     */
    private static int parseLen(String def) {
        int o = def.indexOf('('), c = def.indexOf(')');
        if (o < 0 || c < 0 || c <= o) return 0;
        try { return Integer.parseInt(def.substring(o + 1, c).split(",")[0].trim()); }
        catch (Exception e) { return 0; }
    }

    /**
     * DB 측 컬럼 메타 한 건.
     *
     * @param dataType      information_schema.data_type (예: "character varying")
     * @param charMaxLength 문자형 최대 길이 (숫자형/날짜형은 null)
     */
    private record DbColumn(String dataType, Integer charMaxLength) { }

    /**
     * Entity 필드로부터 산출한 기대 PG 타입/길이 값 객체.
     * {@link #matchesType(String)} 로 실제 DB 타입과 동의어를 흡수해 비교한다.
     */
    private static class ExpectedType {
        /** 기대 PostgreSQL 타입명 (예: "character varying"). "(unknown)" 이면 비교 무조건 통과. */
        final String pgType;
        /** 기대 문자열 길이 (0 이면 길이 검사 생략). */
        final int expectedLength;

        /**
         * @param pgType         기대 PG 타입명
         * @param expectedLength 기대 길이 (0=검사 안 함)
         */
        ExpectedType(String pgType, int expectedLength) {
            this.pgType = pgType;
            this.expectedLength = expectedLength;
        }

        /**
         * 팩토리.
         *
         * @param t   기대 타입명
         * @param len 기대 길이
         * @return 새 ExpectedType
         */
        static ExpectedType of(String t, int len) { return new ExpectedType(t, len); }

        /**
         * 실제 DB 타입이 기대 타입과 호환되는지 판정한다.
         *
         * <p>"(unknown)" 은 항상 true. PostgreSQL 동의어를 흡수한다:
         * character varying ↔ varchar, character ↔ char ↔ bpchar.
         * 그 외에는 문자열 완전 일치 여부로 판정한다.</p>
         *
         * @param actualPgType DB 에서 읽은 소문자 타입명
         * @return 호환되면 true
         */
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
        /**
         * 리포트 표기용 타입 라벨.
         *
         * @return 기대 PG 타입명
         */
        String typeLabel() { return pgType; }
    }

    // ─────────────────────────────────────────────────────────────────
    // 리포트 출력
    // ─────────────────────────────────────────────────────────────────
    /**
     * 검증 결과를 콘솔(System.out)과 로그에 동시에 출력한다.
     *
     * <p>총 미스매치 0건이면 ✅ 통과 배너를, 아니면 ❌ 와 4개 섹션(누락 테이블/누락 컬럼/
     * 타입 불일치/길이 불일치)을 출력한다. logback 패턴/필터 영향을 피하려고 콘솔에
     * 직접 출력하고, 파일 보관용으로 로그에도 남긴다(0건 INFO, 그 외 WARN).</p>
     *
     * @param dbUrl            접속 DB URL
     * @param dbUser           접속 DB 사용자
     * @param schema           검증 스키마
     * @param entityCount      순회한 @Entity 수
     * @param columnsChecked   검사한 컬럼 수
     * @param missingTables    누락 테이블 메시지 목록
     * @param missingColumns   누락 컬럼 메시지 목록
     * @param typeMismatches   타입 불일치 메시지 목록
     * @param lengthMismatches 길이 불일치 메시지 목록
     */
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

    /**
     * 리포트의 한 섹션을 StringBuilder 에 덧붙인다.
     *
     * <p>제목 + 건수를 출력하고, 비어 있으면 "(없음)", 아니면 항목을 테이블명 기준으로
     * {@link TreeMap} 그룹핑(가독성)해 들여쓰기 출력한다. 그룹 키는 각 라인의
     * 첫 토큰('.' 또는 공백 앞부분)을 테이블명으로 간주한다.</p>
     *
     * @param sb    출력 누적 버퍼
     * @param title 섹션 제목
     * @param items 섹션 항목 목록
     */
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
