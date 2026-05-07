package com.shopjoy.ecadminapi.sch.core;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.sch.handler.SchBatchJobHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 배치 작업 실행기.
 * batchCode로 핸들러를 찾아 실행하고 sy_batch 실행 이력을 업데이트한다.
 *
 * 3가지 실행 경로 모두 이 클래스의 execute()를 공통으로 통과한다:
 *
 *   [흐름 1] cron 자동   : CronTrigger → execute()
 *   [흐름 2] 관리자 수동 : POST /api/sch/batch/{}/run → execute()
 *   [흐름 3] Jenkins 외부: POST /api/sch/jenkins/{}  → execute()
 *
 * execute() 내부 흐름:
 *
 *   execute(batch)
 *     │
 *     ├─ handlerMap에서 batchCode 검색
 *     │     없음 → batch_run_status='NO_HANDLER' 저장 후 return
 *     │     있음 ↓
 *     ├─ handler.execute(batch)
 *     │     성공 → updateStatus('SUCCESS', lastRun)
 *     │     예외 → updateStatus('FAIL',    lastRun)
 *     │
 *     └─ updateStatus()
 *           batch_run_status  ← SUCCESS | FAIL | NO_HANDLER
 *           batch_last_run    ← 실행 시각
 *           batch_run_count   ← +1
 *           batch_next_run    ← calcNextRun(cronExpr)  // cron 파싱으로 계산
 *           upd_date          ← now()
 *
 * handlerMap 구성 (최초 execute 호출 시 1회 빌드):
 *   Spring이 @Component 스캔한 SchBatchJobHandler 구현체를
 *   batchCode() → handler 로 매핑.
 *   새 핸들러는 @Component 추가만으로 자동 등록됨.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchBatchExecutor {

    private final SyBatchRepository batchRepository;
    private final List<SchBatchJobHandler> handlers;

    private Map<String, SchBatchJobHandler> handlerMap;

    /** handlerMap */
    private Map<String, SchBatchJobHandler> handlerMap() {
        if (handlerMap == null) {
            handlerMap = handlers.stream()
                .collect(Collectors.toMap(SchBatchJobHandler::batchCode, Function.identity()));
        }
        return handlerMap;
    }

    /** execute — 실행 */
    public void execute(SyBatch batch) {
        String code = batch.getBatchCode();
        SchBatchJobHandler handler = handlerMap().get(code);

        if (handler == null) {
            log.warn("[SCH] 핸들러 없음: batchCode={}", code);
            updateStatus(batch, "NO_HANDLER", null);
            return;
        }

        log.info("[SCH] 시작: batchCode={} batchNm={}", code, batch.getBatchNm());
        LocalDateTime now = LocalDateTime.now();

        try {
            handler.execute(batch);
            log.info("[SCH] 완료: batchCode={}", code);
            updateStatus(batch, "SUCCESS", now);
        } catch (Exception e) {
            log.error("[SCH] 실패: batchCode={} error={}", code, e.getMessage(), e);
            updateStatus(batch, "FAIL", now);
        }
    }

    /** updateStatus — 수정 */
    private void updateStatus(SyBatch batch, String runStatus, LocalDateTime lastRun) {
        try {
            batch.setBatchRunStatus(runStatus);
            if (lastRun != null) {
                batch.setBatchLastRun(lastRun);
                batch.setBatchRunCount(batch.getBatchRunCount() == null ? 1 : batch.getBatchRunCount() + 1);
                batch.setBatchNextRun(calcNextRun(batch.getCronExpr(), lastRun));
            }
            batch.setUpdDate(LocalDateTime.now());
            batchRepository.save(batch);
        } catch (Exception e) {
            log.warn("[SCH] 상태 업데이트 실패: batchCode={}", batch.getBatchCode(), e);
        }
    }

    /** calcNextRun */
    private LocalDateTime calcNextRun(String cronExpr, LocalDateTime from) {
        try {
            return CronExpression.parse(cronExpr).next(from);
        } catch (Exception e) {
            return null;
        }
    }
}
