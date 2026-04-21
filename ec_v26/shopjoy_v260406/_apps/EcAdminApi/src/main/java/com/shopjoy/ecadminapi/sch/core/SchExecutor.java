package com.shopjoy.ecadminapi.sch.core;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
import com.shopjoy.ecadminapi.sch.handler.SchJobHandler;
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
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchExecutor {

    private final SyBatchRepository batchRepository;
    private final List<SchJobHandler> handlers;

    private Map<String, SchJobHandler> handlerMap;

    private Map<String, SchJobHandler> handlerMap() {
        if (handlerMap == null) {
            handlerMap = handlers.stream()
                .collect(Collectors.toMap(SchJobHandler::batchCode, Function.identity()));
        }
        return handlerMap;
    }

    public void execute(SyBatch batch) {
        String code = batch.getBatchCode();
        SchJobHandler handler = handlerMap().get(code);

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

    private LocalDateTime calcNextRun(String cronExpr, LocalDateTime from) {
        try {
            return CronExpression.parse(cronExpr).next(from);
        } catch (Exception e) {
            return null;
        }
    }
}
