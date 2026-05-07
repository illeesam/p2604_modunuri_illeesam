package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 1년 이상 미사용 캐시 자동 소멸 처리
 * batch_code: CACHE_EXPIRE
 * cron: 0 5 1 * * (매월 1일 05:00)
 */
@Slf4j
@Component
public class CacheExpireJob implements SchBatchJobHandler {

    /** batchCode */
    @Override
    public String batchCode() {
        return "CACHE_EXPIRE";
    }

    /** execute — 실행 */
    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 캐시 자동 소멸 시작", batchCode());
        // ec_cache: 1년 이상 미사용 잔액 소멸 처리 → cache_status_cd = EXPIRED
        log.info("[{}] 캐시 자동 소멸 완료", batchCode());
    }
}
