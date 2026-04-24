package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 만료일 경과 쿠폰 상태 변경
 * batch_code: COUPON_EXPIRE
 * cron: 0 1 * * * (매일 01:00)
 */
@Slf4j
@Component
public class CouponExpireJob implements SchBatchJobHandler {

    @Override
    public String batchCode() {
        return "COUPON_EXPIRE";
    }

    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 쿠폰 만료 처리 시작", batchCode());
        // ec_coupon_issue: valid_to < now() → coupon_use_status_cd = EXPIRED
        log.info("[{}] 쿠폰 만료 처리 완료", batchCode());
    }
}
