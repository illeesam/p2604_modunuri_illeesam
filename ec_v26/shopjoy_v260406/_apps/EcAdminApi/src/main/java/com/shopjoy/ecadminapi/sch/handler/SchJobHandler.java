package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;

/**
 * 배치 작업 핸들러 인터페이스.
 * batchCode() 로 등록된 핸들러를 SchExecutor가 자동으로 찾아 실행한다.
 *
 * 구현 예:
 *   @Component
 *   public class ExpiredCouponJob implements SchJobHandler {
 *       @Override public String batchCode() { return "EXPIRED_COUPON"; }
 *       @Override public void execute(SyBatch batch) { ... }
 *   }
 */
public interface SchJobHandler {
    String batchCode();
    void execute(SyBatch batch);
}
