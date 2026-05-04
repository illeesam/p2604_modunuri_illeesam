package com.shopjoy.ecadminapi.common.validation;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * JPA 스키마 검증 전용 러너.
 *
 * spring.profiles.active=validation 일 때만 활성화되어
 *   1) ApplicationContext 기동까지 성공 = Hibernate ddl-auto=validate 통과
 *   2) Entity 스캔 결과(개수/패키지)를 명시적으로 출력
 *   3) JVM 정상 종료 (exit 0)
 *
 * 검증 실패 시에는 이 러너가 실행되기 전에 SchemaManagementException 으로
 * 기동이 중단되며 종료 코드도 0이 아니다.
 */
@Slf4j
@Component
@Profile("validation")
public class JpaSchemaValidationRunner implements ApplicationRunner {

    @PersistenceContext
    private EntityManager em;

    private final ApplicationContext ctx;
    private final Environment env;

    public JpaSchemaValidationRunner(ApplicationContext ctx, Environment env) {
        this.ctx = ctx;
        this.env = env;
    }

    @Override
    public void run(ApplicationArguments args) {
        Set<EntityType<?>> entities = em.getMetamodel().getEntities();
        int entityCount = entities.size();

        // 패키지별 Entity 개수 집계 (트리 정렬)
        Map<String, Integer> pkgCount = new TreeMap<>();
        for (EntityType<?> e : entities) {
            Class<?> javaType = e.getJavaType();
            if (javaType == null || javaType.getPackage() == null) continue;
            String pkg = javaType.getPackage().getName();
            pkgCount.merge(pkg, 1, Integer::sum);
        }

        String dbUrl = "(unknown)";
        String dbUser = "(unknown)";
        try {
            DataSource ds = ctx.getBean(DataSource.class);
            try (Connection conn = ds.getConnection()) {
                dbUrl = conn.getMetaData().getURL();
                dbUser = conn.getMetaData().getUserName();
            }
        } catch (Exception ignore) {
        }

        String schema = env.getProperty("spring.jpa.properties.hibernate.default_schema", "(default)");
        String ddlAuto = env.getProperty("spring.jpa.hibernate.ddl-auto", "(unset)");

        // 결과 라인 수집
        Map<String, String> info = new LinkedHashMap<>();
        info.put("DB URL   ", dbUrl);
        info.put("DB User  ", dbUser);
        info.put("Schema   ", schema);
        info.put("ddl-auto ", ddlAuto);
        info.put("Entity 수", entityCount + " 개");

        String bar = "════════════════════════════════════════════════════════════════════════";

        // 1) Logback INFO 로그 (logs/ecadminapi.log 에도 기록)
        log.info(bar);
        log.info("✅ JPA 스키마 검증 통과 (ddl-auto=validate)");
        info.forEach((k, v) -> log.info("   - {} : {}", k, v));
        log.info("   - 패키지({}) :", pkgCount.size());
        pkgCount.forEach((p, c) -> log.info("       · {} ({}개)", p, c));
        log.info("   ▶ 모든 @Entity 가 DB 컬럼/타입과 일치합니다.");
        log.info(bar);

        // 2) 표준출력으로도 강제 출력 — logback 레벨/필터/패턴과 무관하게 IDE Run 콘솔에 노출
        StringBuilder sb = new StringBuilder();
        sb.append("\n").append(bar).append("\n");
        sb.append("✅ JPA 스키마 검증 통과 (ddl-auto=validate)\n");
        info.forEach((k, v) -> sb.append("   - ").append(k).append(" : ").append(v).append("\n"));
        sb.append("   - 패키지(").append(pkgCount.size()).append(") :\n");
        pkgCount.forEach((p, c) -> sb.append("       · ").append(p).append(" (").append(c).append("개)\n"));
        sb.append("   ▶ 모든 @Entity 가 DB 컬럼/타입과 일치합니다.\n");
        sb.append(bar).append("\n");
        System.out.println(sb);
        System.out.flush();

        // 검증만 수행하고 정상 종료 (exit 0). 컨텍스트가 깔끔히 닫힘.
        int exitCode = SpringApplication.exit(ctx, () -> 0);
        System.exit(exitCode);
    }
}
