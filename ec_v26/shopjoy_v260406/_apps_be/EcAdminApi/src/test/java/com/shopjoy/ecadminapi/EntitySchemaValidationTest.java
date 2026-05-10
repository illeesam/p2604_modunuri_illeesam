package com.shopjoy.ecadminapi;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.metamodel.EntityType;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.metamodel.MappingMetamodel;
import org.hibernate.persister.entity.AbstractEntityPersister;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.fail;

/**
 * base 패키지 JPA 엔티티 ↔ 실제 DB 스키마 검증 테스트.
 *
 * 검증 항목:
 *   ① 엔티티에 정의된 컬럼이 DB에 존재하는지 (entity → DB)
 *   ② DB에 있는 컬럼이 엔티티에 매핑되어 있는지 (DB → entity)
 *
 * 실행: Run Test (IntelliJ) 또는 ./gradlew test --tests EntitySchemaValidationTest
 */
@SpringBootTest
@ActiveProfiles("dev")
class EntitySchemaValidationTest {

    private static final String BASE_PACKAGE = "com.shopjoy.ecadminapi.base";
    private static final String SCHEMA       = "shopjoy_2604";

    @Autowired
    private EntityManagerFactory emf;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("base 엔티티 컬럼이 DB와 일치해야 한다")
    void entityColumnsShouldMatchDatabase() {

        // Hibernate 6 (Spring Boot 3.x) API
        SessionFactoryImplementor sfi = emf.unwrap(SessionFactoryImplementor.class);
        MappingMetamodel mappingMetamodel = sfi.getMappingMetamodel();

        List<String> errors   = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        int checked = 0;

        for (EntityType<?> entityType : emf.getMetamodel().getEntities()) {

            Class<?> entityClass = entityType.getJavaType();

            // base 패키지 엔티티만 검증
            if (!entityClass.getName().startsWith(BASE_PACKAGE)) continue;

            AbstractEntityPersister aep = (AbstractEntityPersister)
                    mappingMetamodel.getEntityDescriptor(entityType.getJavaType().getName());

            // 테이블명 추출 (schema.table → table)
            String qualifiedTable = aep.getTableName();
            String tableName = qualifiedTable.contains(".")
                    ? qualifiedTable.substring(qualifiedTable.lastIndexOf('.') + 1)
                    : qualifiedTable;

            // DB 컬럼 조회
            Set<String> dbCols = fetchDbColumns(SCHEMA, tableName);
            if (dbCols.isEmpty()) {
                errors.add("[" + tableName + "] DB에 테이블 없음 (엔티티: " + entityClass.getSimpleName() + ")");
                continue;
            }

            // 엔티티 컬럼 수집 (Hibernate persister 기반)
            Set<String> entityCols = collectEntityColumns(aep);

            // ① entity → DB
            for (String col : entityCols) {
                if (!dbCols.contains(col)) {
                    errors.add("[" + tableName + "." + col + "] 엔티티에 있지만 DB에 없음");
                }
            }

            // ② DB → entity (누락은 warning으로 처리 — DB에만 있는 컬럼은 의도적일 수 있음)
            for (String col : dbCols) {
                if (!entityCols.contains(col)) {
                    warnings.add("[" + tableName + "." + col + "] DB에 있지만 엔티티에 미매핑");
                }
            }

            checked++;
        }

        // 결과 출력
        System.out.println("\n========== Entity-DB Schema Validation ==========");
        System.out.printf("검증 완료 테이블: %d개%n%n", checked);

        if (!warnings.isEmpty()) {
            System.out.println("▶ DB에만 있는 컬럼 (미매핑, " + warnings.size() + "건):");
            warnings.forEach(w -> System.out.println("  ⚠ " + w));
            System.out.println();
        }

        if (!errors.isEmpty()) {
            System.out.println("▶ 불일치 오류 (" + errors.size() + "건):");
            errors.forEach(e -> System.out.println("  ✗ " + e));
            System.out.println();
            fail("Entity-DB 스키마 불일치 " + errors.size() + "건 발견:\n"
                    + errors.stream().collect(Collectors.joining("\n")));
        }

        System.out.println("✓ 모든 엔티티 컬럼이 DB와 일치합니다.");
        System.out.println("=================================================\n");
    }

    // ─────────────────────────────────────────────
    // Hibernate AbstractEntityPersister로 컬럼명 수집
    // ─────────────────────────────────────────────
    private Set<String> collectEntityColumns(AbstractEntityPersister aep) {
        Set<String> cols = new LinkedHashSet<>();

        // PK 컬럼
        String[] pkCols = aep.getIdentifierColumnNames();
        if (pkCols != null) {
            for (String pk : pkCols) cols.add(pk.toLowerCase());
        }

        // 일반 프로퍼티 컬럼
        String[] propNames = aep.getPropertyNames();
        if (propNames != null) {
            for (String prop : propNames) {
                String[] propCols = aep.getPropertyColumnNames(prop);
                if (propCols != null) {
                    for (String col : propCols) {
                        if (col != null && !col.isBlank()) {
                            cols.add(col.toLowerCase());
                        }
                    }
                }
            }
        }
        return cols;
    }

    // ─────────────────────────────────────────────
    // information_schema로 실제 DB 컬럼 조회
    // ─────────────────────────────────────────────
    private Set<String> fetchDbColumns(String schema, String table) {
        String sql = """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = ? AND table_name = ?
                ORDER BY ordinal_position
                """;
        List<String> cols = jdbcTemplate.queryForList(sql, String.class, schema, table);
        return cols.stream().map(String::toLowerCase).collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
