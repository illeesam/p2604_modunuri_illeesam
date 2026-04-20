package com.shopjoy.ecadminapi;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * _doc/sample_data.sql + _doc/sample_data_ec.sql 을 DB에 실행하는 테스트
 *
 * 실행:
 *   ./gradlew test --tests "com.shopjoy.ecadminapi.SampleDataInsertTest"
 *
 * 전제:
 *   - application-dev.yml DB 접속 설정이 올바를 것
 *   - node _doc/generate_sample_sql.js    → sample_data.sql
 *   - node _doc/generate_sample_sql_ec.js → sample_data_ec.sql
 */
@SpringBootTest
@ActiveProfiles("dev")
class SampleDataInsertTest {

    @Autowired
    DataSource dataSource;

    @Test
    void insertSampleData() throws Exception {
        Path docDir = Paths.get(System.getProperty("user.dir"))
                .getParent().getParent()
                .resolve("_doc");

        runSqlFile(docDir.resolve("sample_data.sql"),
                "node _doc/generate_sample_sql.js");
        runSqlFile(docDir.resolve("sample_data_ec.sql"),
                "node _doc/generate_sample_sql_ec.js");
        runSqlFile(docDir.resolve("sample_data_front.sql"),
                "node _doc/generate_sample_sql_front.js");
        runSqlFile(docDir.resolve("sample_data_dp.sql"),
                "node _doc/generate_sample_sql_dp.js");
        runSqlFile(docDir.resolve("sample_data_prod.sql"),
                "node _doc/generate_sample_sql_prod.js");
        runSqlFile(docDir.resolve("sample_data_prod2.sql"),
                "node _doc/generate_sample_sql_prod2.js");
        runSqlFile(docDir.resolve("sample_data_pm.sql"),
                "node _doc/generate_sample_sql_pm.js");
        runSqlFile(docDir.resolve("sample_data_od.sql"),
                "node _doc/generate_sample_sql_od.js");
        runSqlFile(docDir.resolve("sample_data_sy.sql"),
                "node _doc/generate_sample_sql_sy.js");
        runSqlFile(docDir.resolve("sample_data_i18n.sql"),
                "node _doc/generate_sample_sql_i18n.js");
        runSqlFile(docDir.resolve("sample_data_tmpl.sql"),
                "node _doc/generate_sample_sql_tmpl.js");
        runSqlFile(docDir.resolve("sample_data_tmpl_update.sql"),
                "수동 작성 — 브랜드명 치환");
        runSqlFile(docDir.resolve("sample_data_st.sql"),
                "node _doc/generate_sample_sql_st.js");
        runSqlFile(docDir.resolve("sample_data_bltn.sql"),
                "node _doc/generate_sample_sql_bltn.js");
    }

    private void runSqlFile(Path sqlFile, String hint) throws Exception {
        System.out.println("\n▶ SQL 파일: " + sqlFile.toAbsolutePath());

        if (!sqlFile.toFile().exists()) {
            System.out.println("  파일 없음 — " + hint + " 먼저 실행");
            return;
        }

        List<String> statements = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(
                new FileReader(sqlFile.toFile(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.startsWith("--") || trimmed.isEmpty()) continue;
                sb.append(line).append('\n');
                if (trimmed.endsWith(";")) {
                    statements.add(sb.toString().trim());
                    sb.setLength(0);
                }
            }
        }

        int ok = 0, skip = 0, err = 0;
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            conn.setAutoCommit(false);
            int spIdx = 0;
            for (String sql : statements) {
                if (sql.isBlank()) continue;
                String sp = "sp_" + (spIdx++);
                try {
                    stmt.execute("SAVEPOINT " + sp);
                    stmt.execute(sql);
                    ok++;
                } catch (Exception e) {
                    try { stmt.execute("ROLLBACK TO SAVEPOINT " + sp); } catch (Exception ignored) {}
                    String msg = e.getMessage();
                    if (msg != null && (msg.contains("duplicate") || msg.contains("already exists"))) {
                        skip++;
                    } else {
                        System.err.println("[ERR] " + (msg != null ? msg.lines().findFirst().orElse(msg) : "?"));
                        System.err.println("  SQL: " + sql.substring(0, Math.min(150, sql.length())));
                        err++;
                    }
                }
            }
            conn.commit();
        }

        System.out.printf("  완료: 성공=%d, 스킵(중복)=%d, 오류=%d (총 %d건)%n",
                ok, skip, err, statements.size());
    }
}
