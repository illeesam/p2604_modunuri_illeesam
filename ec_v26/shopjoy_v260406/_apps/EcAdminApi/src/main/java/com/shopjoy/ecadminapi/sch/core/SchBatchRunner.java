package com.shopjoy.ecadminapi.sch.core;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.sch.config.SchBatchProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 애플리케이션 시작 시 sy_batch 테이블의 ACTIVE 배치를 자동으로 스케줄 등록.
 * app.scheduler.enabled=false 이면 전체 스킵.
 *
 * ════════════════════════════════════════════════════════════════════
 * [흐름 1] 기본 배치 자동 실행 (jenkins.enabled=false, cron 방식)
 * ════════════════════════════════════════════════════════════════════
 *
 *   앱 기동
 *     │
 *     ▼
 *   SchBatchRunner.run()
 *     │  app.scheduler.enabled=false → 종료(스킵)
 *     │  app.scheduler.enabled=true  ↓
 *     ▼
 *   sy_batch WHERE batch_status_cd='ACTIVE' 조회
 *     │
 *     ▼
 *   SchBatchJobRegistry.register(batch) ── jenkins.enabled=true → 등록 생략
 *     │  jenkins.enabled=false ↓
 *     │  cron 5필드 → Spring 6필드 변환 ("0 " 앞에 추가)
 *     ▼
 *   ThreadPoolTaskScheduler.schedule(CronTrigger)
 *     │
 *     │  [cron 시간 도래]
 *     ▼
 *   SchBatchExecutor.execute(batch)
 *     │  batchCode로 핸들러 검색
 *     │  핸들러 없음 → batch_run_status='NO_HANDLER' 저장 후 종료
 *     ▼
 *   SchBatchJobHandler.execute(batch)   ← 각 Job 구현체 (e.g. CouponExpireJob)
 *     │
 *     ▼
 *   sy_batch 상태 업데이트
 *     batch_run_status = SUCCESS | FAIL
 *     batch_last_run   = 실행 시각
 *     batch_run_count  = +1
 *     batch_next_run   = 다음 cron 시각
 *
 * ════════════════════════════════════════════════════════════════════
 * [흐름 2] 관리자 Controller 수동 실행
 * ════════════════════════════════════════════════════════════════════
 *
 *   관리자 → POST /api/sch/batch/{batchCode}/run   (@BoOnly 인증)
 *     │
 *     ▼
 *   SchBatchController.run()
 *     │  sy_batch WHERE batch_code=? 조회 (없으면 CmBizException)
 *     ▼
 *   SchBatchExecutor.execute(batch)       ← 흐름 1의 execute 이후와 동일
 *     │
 *     ▼
 *   SchBatchJobHandler.execute(batch)
 *     │
 *     ▼
 *   sy_batch 상태 업데이트 → HTTP 200 반환
 *
 *   기타 관리자 API:
 *     GET  /api/sch/batch          → 배치 목록 + 등록 상태 + 실행 모드(CRON|JENKINS)
 *     POST /api/sch/batch/{}/on    → cron 스케줄 등록
 *     POST /api/sch/batch/{}/off   → cron 스케줄 해제
 *     POST /api/sch/reload         → 전체 unregister → DB 재조회 → 재등록
 *
 * ════════════════════════════════════════════════════════════════════
 * [흐름 3] Jenkins 외부 호출 실행 (jenkins.enabled=true)
 * ════════════════════════════════════════════════════════════════════
 *
 *   앱 기동 시 cron 등록 생략 (SchBatchJobRegistry.register → 즉시 return)
 *
 *   Jenkins Pipeline
 *     │  httpRequest POST /api/sch/jenkins/{batchCode}
 *     │  Header: X-Jenkins-Token: ${JENKINS_BATCH_TOKEN}
 *     ▼
 *   SchBatchController.jenkinsRun()
 *     │  jenkins.enabled=false → 403 반환
 *     │  jenkins.enabled=true  ↓
 *     │  토큰 검증 실패         → 401 반환
 *     │  토큰 검증 성공         ↓
 *     ▼
 *   SchBatchExecutor.execute(batch)       ← 흐름 1의 execute 이후와 동일
 *     │
 *     ▼
 *   SchBatchJobHandler.execute(batch)
 *     │
 *     ▼
 *   sy_batch 상태 업데이트 → HTTP 200 반환 → Jenkins 결과 수신
 *
 *   설정 (application-prod.yml):
 *     app.scheduler.jenkins.enabled: true
 *     app.scheduler.jenkins.token:   ${JENKINS_BATCH_TOKEN}
 * ════════════════════════════════════════════════════════════════════
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchBatchRunner implements ApplicationRunner {

    private final SchBatchProperties properties;
    private final SyBatchRepository batchRepository;
    private final SchBatchJobRegistry registry;

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            log.info("[SCH] 스케줄러 비활성 (app.scheduler.enabled=false)");
            return;
        }

        List<SyBatch> activeBatches = batchRepository.findByBatchStatusCd("ACTIVE");

        if (activeBatches.isEmpty()) {
            log.info("[SCH] 등록할 ACTIVE 배치 없음");
            return;
        }

        activeBatches.forEach(registry::register);
        log.info("[SCH] 스케줄러 시작 완료 — {}개 배치 등록", registry.registeredCount());
    }
}
