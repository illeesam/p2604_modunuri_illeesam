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
