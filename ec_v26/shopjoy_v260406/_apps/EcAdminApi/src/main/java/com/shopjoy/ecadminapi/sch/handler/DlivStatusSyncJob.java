package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 택배사 API 연동 배송 상태 업데이트
 * batch_code: DLIV_STATUS_SYNC
 * cron: 0 *\/2 * * * (2시간마다)
 */
@Slf4j
@Component
public class DlivStatusSyncJob implements SchBatchJobHandler {

    /** batchCode */
    @Override
    public String batchCode() {
        return "DLIV_STATUS_SYNC";
    }

    /** execute — 실행 */
    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 배송 상태 동기화 시작", batchCode());
        // ec_dliv: dliv_status_cd = SHIPPED 인 건 → 택배사 API 조회 → 상태 업데이트
        log.info("[{}] 배송 상태 동기화 완료", batchCode());
    }
}
