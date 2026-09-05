package com.shopjoy.ecBeCdn.log.controller;

import com.shopjoy.ecBeCdn.common.exception.CfBizException;
import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DB 연결 테스트 API — /api/cdn/db/test (요청사항: "db연결테스트화면도 추가해줘 url, port, id, pwd
 * 등 입력하여 jdbc 연결되는지 테스트할거야 주로 간단한 select 되는지도 점검할거야 페이징정보 없으면
 * 기본 10건"). 앱이 이미 쓰고 있는 datasource 커넥션풀이 아니라, 화면에서 입력한 접속정보로 그때
 * 그때 별도 JDBC 커넥션을 열어 확인한다(PostgreSQL 전용 — 이 프로젝트 전체가 PostgreSQL 만 씀).
 *
 * <p>⚠ 인증없이 누구나 접근 가능한 화면(/api/cdn/** permitAll)이라 안전장치를 둔다:
 * SELECT 로 시작하는 문장만 허용(DDL/DML 차단), 커넥션·쿼리 타임아웃 5~10초, 결과는 항상
 * LIMIT/OFFSET 로 감싸 페이징(기본 10건, 최대 500건) — 대량 조회로 서버 자원을 소모하는 것도 방지.</p>
 */
@RestController
@RequestMapping("/api/cdn/db")
public class CfDbTestController {

    @Getter
    @Setter
    public static class Req {
        private String host;
        private Integer port;
        private String dbName;
        private String schema;
        private String username;
        private String password;
        private String sql;
        private Integer pageNo;
        private Integer pageSize;
    }

    @PostMapping("/test")
    public ApiResponse<Map<String, Object>> test(@RequestBody Req req) {
        if (req.getHost() == null || req.getHost().isBlank()) throw new CfBizException("host 를 입력하세요.");
        if (req.getSql() == null || req.getSql().isBlank()) throw new CfBizException("조회할 SQL(SELECT)을 입력하세요.");

        String sql = req.getSql().trim();
        if (sql.endsWith(";")) sql = sql.substring(0, sql.length() - 1).trim();
        // 안전장치: SELECT/WITH(CTE) 로 시작하는 조회문만 허용 — DDL/DML 완전 차단.
        String head = sql.replaceAll("^--.*$", "").trim().toUpperCase();
        if (!(head.startsWith("SELECT") || head.startsWith("WITH"))) {
            throw new CfBizException("SELECT(또는 WITH ... SELECT) 문만 실행할 수 있습니다.");
        }

        int port = req.getPort() != null ? req.getPort() : 5432;
        int pageNo = req.getPageNo() != null && req.getPageNo() > 0 ? req.getPageNo() : 1;
        int pageSize = req.getPageSize() != null && req.getPageSize() > 0 ? Math.min(req.getPageSize(), 500) : 10;
        int offset = (pageNo - 1) * pageSize;

        StringBuilder url = new StringBuilder("jdbc:postgresql://")
            .append(req.getHost()).append(':').append(port).append('/')
            .append(req.getDbName() == null || req.getDbName().isBlank() ? "postgres" : req.getDbName());
        if (req.getSchema() != null && !req.getSchema().isBlank()) {
            url.append("?currentSchema=").append(req.getSchema());
        }

        try {
            DriverManager.setLoginTimeout(5);
            try (Connection conn = DriverManager.getConnection(url.toString(), req.getUsername(), req.getPassword())) {
                long total = fnCount(conn, sql);
                List<String> columns = new ArrayList<>();
                List<Map<String, Object>> rows = new ArrayList<>();
                String paged = "SELECT * FROM (" + sql + ") AS _cf_db_test_sub_ LIMIT ? OFFSET ?";
                try (PreparedStatement ps = conn.prepareStatement(paged)) {
                    ps.setQueryTimeout(10);
                    ps.setInt(1, pageSize);
                    ps.setInt(2, offset);
                    try (ResultSet rs = ps.executeQuery()) {
                        ResultSetMetaData meta = rs.getMetaData();
                        int colCount = meta.getColumnCount();
                        for (int i = 1; i <= colCount; i++) columns.add(meta.getColumnLabel(i));
                        while (rs.next()) {
                            Map<String, Object> row = new LinkedHashMap<>();
                            for (int i = 1; i <= colCount; i++) {
                                Object v = rs.getObject(i);
                                row.put(columns.get(i - 1), v == null ? null : String.valueOf(v));
                            }
                            rows.add(row);
                        }
                    }
                }

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("connected", true);
                result.put("columns", columns);
                result.put("rows", rows);
                result.put("pageNo", pageNo);
                result.put("pageSize", pageSize);
                result.put("pageTotalCount", total);
                result.put("pageTotalPage", Math.max(1, (int) Math.ceil(total / (double) pageSize)));
                return ApiResponse.ok(result);
            }
        } catch (SQLException e) {
            throw new CfBizException("DB 연결/조회 실패: " + e.getMessage());
        }
    }

    private long fnCount(Connection conn, String sql) throws SQLException {
        String countSql = "SELECT COUNT(*) FROM (" + sql + ") AS _cf_db_test_cnt_";
        try (PreparedStatement ps = conn.prepareStatement(countSql)) {
            ps.setQueryTimeout(10);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0L;
            }
        }
    }
}
