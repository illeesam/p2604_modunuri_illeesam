package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 일별/주별/월별 통계 데이터 사전 집계
 * batch_code: STATS_AGGREGATION
 * cron: 0 0 * * * (매일 00:00)
 */
@Slf4j
@Component
public class StatsAggregationJob implements SchBatchJobHandler {

    @Override
    public String batchCode() {
        return "STATS_AGGREGATION";
    }

    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 통계 데이터 집계 시작", batchCode());
        // 주문/매출/회원 일별 통계 집계 → 통계 테이블 upsert
        log.info("[{}] 통계 데이터 집계 완료", batchCode());
    }
}
