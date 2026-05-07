package com.shopjoy.ecadminapi.sch.core;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.sch.config.SchBatchProperties;
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
 *
 * [실행 모드 비교]
 * ┌──────────────────┬──────────────────────────────────────────────────────┐
 * │ jenkins.enabled  │ 동작                                                  │
 * ├──────────────────┼──────────────────────────────────────────────────────┤
 * │ false (기본)     │ cron 기반 자동 스케줄 등록. 내부 ThreadPool이 실행.    │
 * │ true             │ cron 등록 생략. Jenkins가 외부에서 직접 API 호출 실행. │
 * └──────────────────┴──────────────────────────────────────────────────────┘
 *
 * register() 흐름:
 *
 *   register(batch)
 *     │
 *     ├─ jenkins.enabled=true  → log(생략) → return  (cron 미등록)
 *     │
 *     ├─ cronExpr 없음         → log(경고) → return
 *     │
 *     ├─ unregister(code)      기존 등록된 동일 batchCode 제거
 *     │
 *     ├─ cron 변환
 *     │     5필드(분 시 일 월 요일) → "0 " + cron  (Spring 6필드)
 *     │     6필드 이상              → 그대로 사용
 *     │
 *     └─ TaskScheduler.schedule(CronTrigger)
 *           성공 → futures.put(batchCode, future)
 *           실패 → log(오류)  (예외 삼킴, 앱 기동 중단 방지)
 *
 * 관리 메서드:
 *   unregister(code)   → future.cancel(false) + futures.remove
 *   unregisterAll()    → 전체 unregister (reload 시 사용)
 *   isRegistered(code) → futures.containsKey
 *   registeredCount()  → futures.size
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchBatchJobRegistry {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final SchBatchExecutor executor;
    private final SchBatchProperties properties;

    private final Map<String, ScheduledFuture<?>> futures = new ConcurrentHashMap<>();

    /** register — 등록 */
    public void register(SyBatch batch) {
        String code = batch.getBatchCode();

        // Jenkins 모드: cron 자동 등록 생략 (Jenkins가 외부 API로 직접 호출)
        if (properties.getJenkins().isEnabled()) {
            log.info("[SCH] Jenkins 모드 - cron 등록 생략: batchCode={}", code);
            return;
        }

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

    /** unregister — 등록해제 */
    public void unregister(String batchCode) {
        ScheduledFuture<?> existing = futures.remove(batchCode);
        if (existing != null) {
            existing.cancel(false);
            log.info("[SCH] 해제: batchCode={}", batchCode);
        }
    }

    /** unregisterAll — 등록해제 */
    public void unregisterAll() {
        futures.keySet().forEach(this::unregister);
    }

    /** isRegistered — 여부 */
    public boolean isRegistered(String batchCode) {
        return futures.containsKey(batchCode);
    }

    /** registeredCount */
    public int registeredCount() {
        return futures.size();
    }
}
