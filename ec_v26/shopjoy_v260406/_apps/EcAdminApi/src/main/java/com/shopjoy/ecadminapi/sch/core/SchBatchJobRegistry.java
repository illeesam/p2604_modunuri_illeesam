package com.shopjoy.ecadminapi.sch.core;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * 실행 중인 배치 스케줄 레지스트리.
 * batchCode → ScheduledFuture 매핑을 관리하며 동적 등록/해제/재등록을 지원한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchBatchJobRegistry {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final SchBatchExecutor executor;

    private final Map<String, ScheduledFuture<?>> futures = new ConcurrentHashMap<>();

    public void register(SyBatch batch) {
        String code = batch.getBatchCode();
        String cron = batch.getCronExpr();

        if (cron == null || cron.isBlank()) {
            log.warn("[SCH] cron 표현식 없음: batchCode={}", code);
            return;
        }

        unregister(code);

        // Unix 5필드 cron(분 시 일 월 요일)을 Spring 6필드(초 분 시 일 월 요일)로 자동 변환
        String springCron = cron.trim().split("\\s+").length == 5 ? "0 " + cron.trim() : cron.trim();

        try {
            ScheduledFuture<?> future = taskScheduler.schedule(
                () -> executor.execute(batch),
                new CronTrigger(springCron)
            );
            futures.put(code, future);
            log.info("[SCH] 등록: batchCode={} springCron={} (초 분 시 일 월 요일)", code, springCron);
        } catch (Exception e) {
            log.error("[SCH] 등록 실패: batchCode={} cron={} error={}", code, springCron, e.getMessage());
        }
    }

    public void unregister(String batchCode) {
        ScheduledFuture<?> existing = futures.remove(batchCode);
        if (existing != null) {
            existing.cancel(false);
            log.info("[SCH] 해제: batchCode={}", batchCode);
        }
    }

    public void unregisterAll() {
        futures.keySet().forEach(this::unregister);
    }

    public boolean isRegistered(String batchCode) {
        return futures.containsKey(batchCode);
    }

    public int registeredCount() {
        return futures.size();
    }
}
