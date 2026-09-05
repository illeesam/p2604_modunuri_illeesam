package com.shopjoy.ecBeBo.bo.sy.controller;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyhExtTestLog;
import com.shopjoy.ecBeBo.base.sy.repository.SyhExtTestLogRepository;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import com.shopjoy.ecBeBo.common.response.PageResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;
/**
 * 외부 연동 테스트 이력 API — /api/bo/sy/ext-test-log
 * ZdInfDashboard 테스트 결과를 기록하고 채널별 이력을 조회합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/bo/sy/ext-test-log")
@RequiredArgsConstructor
public class BoSyExtTestLogController {

    private final SyhExtTestLogRepository repository;
    private final JdbcTemplate jdbc;

    /** 기동 시 테이블이 없으면 자동 생성 */
    @PostConstruct
    public void initTable() {
        try {
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS shopjoy_2604.syh_ext_test_log (
                    log_id         VARCHAR(40)   NOT NULL,
                    channel_key    VARCHAR(60)   NOT NULL,
                    channel_label  VARCHAR(100),
                    test_result    VARCHAR(10)   NOT NULL,
                    test_msg       VARCHAR(2000),
                    test_url       VARCHAR(500),
                    test_req_body  VARCHAR(2000),
                    test_account   VARCHAR(200),
                    reg_by         VARCHAR(40),
                    reg_date       TIMESTAMP,
                    upd_by         VARCHAR(40),
                    upd_date       TIMESTAMP,
                    CONSTRAINT pk_syh_ext_test_log PRIMARY KEY (log_id)
                )
                """);
            /* 기존 테이블에 신규 컬럼 추가 (이미 있으면 무시) */
            try { jdbc.execute("ALTER TABLE shopjoy_2604.syh_ext_test_log ADD COLUMN IF NOT EXISTS test_req_body VARCHAR(2000)"); } catch (Exception ignored) {}
            try { jdbc.execute("ALTER TABLE shopjoy_2604.syh_ext_test_log ADD COLUMN IF NOT EXISTS test_account VARCHAR(200)"); } catch (Exception ignored) {}
            try { jdbc.execute("ALTER TABLE shopjoy_2604.syh_ext_test_log DROP COLUMN IF EXISTS site_id"); } catch (Exception ignored) {}

            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_syh_ext_test_log_ch ON shopjoy_2604.syh_ext_test_log (channel_key, reg_date DESC)");
        } catch (Exception e) {
            log.warn("syh_ext_test_log 테이블 초기화 경고: {}", e.getMessage());
        }
    }

    /** 테스트 이력 저장 */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SyhExtTestLog>> save(@RequestBody Map<String, Object> body) {
        /* 감사컬럼은 EntitySaveListener 가 @PrePersist 에서 주입 */
        SyhExtTestLog entity = SyhExtTestLog.builder()
            .logId(UUID.randomUUID().toString().replace("-", ""))   // 32자 고정
            .channelKey(str(body, "channelKey", "unknown"))
            .channelLabel(str(body, "channelLabel", null))
            .testResultCd(str(body, "testResultCd", "FAIL"))
            .testMsg(str(body, "testMsg", null))
            .testUrl(str(body, "testUrl", null))
            .testReqBody(str(body, "testReqBody", null))
            .testAccount(str(body, "testAccount", null))
            .build();
        SyhExtTestLog saved = repository.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    /** 채널별 이력 조회 (페이징) — channelKey 없으면 전체 조회 */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<PageResult<SyhExtTestLog>>> list(
            @RequestParam(required = false) String channelKey,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "5")  int pageSize) {
        PageRequest pr = PageRequest.of(pageNo - 1, pageSize);
        Page<SyhExtTestLog> page = (channelKey != null && !channelKey.isBlank())
            ? repository.findByChannelKey(channelKey, pr)
            : repository.findAllByOrderByRegDateDesc(pr);
        PageResult<SyhExtTestLog> result = PageResult.of(
            page.getContent(), page.getTotalElements(), pageNo, pageSize, null);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 채널별 최신 이력 1건씩 조회 (연동결과 초기값용) */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<java.util.List<SyhExtTestLog>>> latest() {
        java.util.List<SyhExtTestLog> list = repository.selectLatestByChannel();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    private String str(Map<String, Object> m, String key, String def) {
        Object v = m.get(key);
        return (v != null && !v.toString().isBlank()) ? v.toString() : def;
    }
}
