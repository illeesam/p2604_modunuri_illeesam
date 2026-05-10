package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 배송완료 후 7일 경과 주문 자동 완료 처리
 * batch_code: ORDER_AUTO_COMPLETE
 * cron: 0 2 * * * (매일 02:00)
 */
@Slf4j
@Component
public class OrderAutoCompleteJob implements SchBatchJobHandler {

    /** batchCode */
    @Override
    public String batchCode() {
        return "ORDER_AUTO_COMPLETE";
    }

    /** execute — 실행 */
    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 주문 자동 완료 처리 시작", batchCode());
        // ec_order: dliv_complete_date + 7일 경과 → order_status_cd = COMPLT
        log.info("[{}] 주문 자동 완료 처리 완료", batchCode());
    }
}
