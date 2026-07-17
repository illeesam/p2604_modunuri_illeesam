package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 유효기간 만료 쿠폰 상태 자동 변경
 * batch_code: COUPON_EXPIRE
 * cron: 0 1 * * * (매일 01:00)
 *
 * <p><b>처리 대상</b>: pm_coupon.valid_to &lt; today
 * <ul>
 *   <li>use_yn = 'Y' 인 쿠폰만 대상 (수동 비활성 쿠폰은 배치가 건드리지 않음)</li>
 *   <li>이미 EXPIRED 인 쿠폰은 제외</li>
 *   <li>valid_to 가 null 인 쿠폰은 스킵 (무기한 쿠폰)</li>
 * </ul>
 *
 * <p><b>상태 전환</b>: ACTIVE | PENDING → EXPIRED
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CouponExpireJob implements SchBatchJobHandler {

    private static final String EXPIRED = "EXPIRED";

    private final PmCouponRepository couponRepository;

    @Override
    public String batchCode() {
        return "COUPON_EXPIRE";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDate     today = LocalDate.now();
        LocalDateTime now   = LocalDateTime.now();
        log.info("[{}] 쿠폰 만료 처리 시작 — 기준일: {}", batchCode(), today);

        List<PmCoupon> targets = couponRepository.findExpireTargets(today);
        log.info("[{}] 만료 대상 쿠폰 {}건", batchCode(), targets.size());

        int count = 0;
        for (PmCoupon coupon : targets) {
            log.debug("[{}] 만료 처리: couponId={} couponNm={} validTo={} status={}→EXPIRED",
                batchCode(), coupon.getCouponId(), coupon.getCouponNm(),
                coupon.getValidTo(), coupon.getCouponStatusCd());

            coupon.setCouponStatusCdBefore(coupon.getCouponStatusCd());
            coupon.setCouponStatusCd(EXPIRED);
            coupon.setUpdBy("BATCH");
            coupon.setUpdDate(now);
            couponRepository.save(coupon);
            count++;
        }

        log.info("[{}] 쿠폰 만료 처리 완료 — {}건 EXPIRED 처리", batchCode(), count);
    }
}
