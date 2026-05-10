package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 개발용 10분마다 실행 로그 확인 배치
 * batch_code: DEV_10MINUTE_LOG
 * cron: 0 *\/10 * * * (10분마다)
 */
@Slf4j
@Component
public class Dev10MinuteLogJob implements SchBatchJobHandler {

    /** batchCode */
    @Override
    public String batchCode() {
        return "DEV_10MINUTE_LOG";
    }

    /** execute — 실행 */
    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 10분 주기 배치 실행 확인 - batchId={}", batchCode(), batch.getBatchId());
    }
}
