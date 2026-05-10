package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 월간 정산 리포트 자동 생성 및 이메일 발송
 * batch_code: SETTLEMENT_REPORT
 * cron: 0 8 1 * * (매월 1일 08:00)
 */
@Slf4j
@Component
public class SettlementReportJob implements SchBatchJobHandler {

    /** batchCode */
    @Override
    public String batchCode() {
        return "SETTLEMENT_REPORT";
    }

    /** execute — 실행 */
    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 정산 리포트 생성 시작", batchCode());
        // TODO: 전월 정산 데이터 집계 → 리포트 생성 → 이메일 발송
        log.info("[{}] 정산 리포트 생성 완료", batchCode());
    }
}
