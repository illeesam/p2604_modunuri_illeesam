package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 이벤트 시작/종료일 기준 상태 자동 동기화
 * batch_code: EVENT_STATUS_SYNC
 * cron: 0 0 * * * (매일 00:00)
 */
@Slf4j
@Component
public class EventStatusSyncJob implements SchBatchJobHandler {

    @Override
    public String batchCode() {
        return "EVENT_STATUS_SYNC";
    }

    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 이벤트 상태 동기화 시작", batchCode());
        // ec_event: start_date/end_date 기준 → event_status_cd ACTIVE/ENDED 자동 전환
        log.info("[{}] 이벤트 상태 동기화 완료", batchCode());
    }
}
