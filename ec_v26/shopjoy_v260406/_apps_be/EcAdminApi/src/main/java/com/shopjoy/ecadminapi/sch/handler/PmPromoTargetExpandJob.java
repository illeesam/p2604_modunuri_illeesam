package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * 프로모션 적용 상품 전개 배치.
 * batch_code: PROMO_TARGET_EXPAND
 * cron: 0 3 * * * (매일 03:00)
 *
 * <p><b>처리 대상</b>: pm_coupon / pm_discnt / pm_event / pm_save 중 use_yn='Y' 이고
 * 유효 기간 내(오늘 기준) 또는 기간 무관 프로모션의 item 목록을 상품 단위로 전개하여
 * pm_coupon_prod / pm_discnt_prod / pm_event_prod / pm_save_prod 에 적재.
 *
 * <p><b>target_type_cd 처리 규칙</b>:
 * <ul>
 *   <li>PRODUCT  — target_id = prod_id 직접 매핑</li>
 *   <li>CATEGORY — target_id = category_id → pd_category_prod JOIN으로 확장</li>
 *   <li>BRAND    — target_id = brand_id    → pd_prod.brand_id 필터로 확장</li>
 *   <li>VENDOR   — target_id = vendor_id   → pd_prod.vendor_id 필터로 확장</li>
 * </ul>
 *
 * <p><b>재계산 전략</b>: 활성 프로모션 ID 목록을 먼저 DELETE 후 INSERT.
 * 배치 도중 실패해도 트랜잭션 롤백으로 이전 데이터 유지.
 */
@Slf4j
@Component
public class PmPromoTargetExpandJob implements SchBatchJobHandler {

    private static final String S = "shopjoy_2604";

    @PersistenceContext
    private EntityManager em;

    @Override
    public String batchCode() {
        return "PROMO_TARGET_EXPAND";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDate today = LocalDate.now();
        log.info("[{}] 프로모션 상품 전개 시작 — 기준일: {}", batchCode(), today);

        int[] c = expandCoupon(today);
        int[] d = expandDiscnt(today);
        int[] e = expandEvent(today);
        int[] s = expandSave(today);

        log.info("[{}] 완료 — 쿠폰: {}건/{}행 | 할인: {}건/{}행 | 이벤트: {}건/{}행 | 적립금: {}건/{}행",
            batchCode(),
            c[0], c[1], d[0], d[1], e[0], e[1], s[0], s[1]);
    }

    // ── 쿠폰 ─────────────────────────────────────────────────────────────────

    /** @return [promoCount, prodRowCount] */
    private int[] expandCoupon(LocalDate today) {
        // 활성 쿠폰 (use_yn=Y, EXPIRED 아님, 유효기간 내 또는 기간 미설정)
        int deleted = em.createNativeQuery("""
                DELETE /* sch :: PromoTargetExpandJob :: expandCoupon-delete */
                FROM %s.pm_coupon_prod cp
                WHERE cp.coupon_id IN (
                    SELECT c.coupon_id FROM %s.pm_coupon c
                    WHERE c.use_yn = 'Y'
                      AND c.coupon_status_cd <> 'EXPIRED'
                      AND (c.valid_to IS NULL OR c.valid_to >= :today)
                )
                """.formatted(S, S))
            .setParameter("today", today)
            .executeUpdate();

        int inserted = em.createNativeQuery("""
                INSERT /* sch :: PromoTargetExpandJob :: expandCoupon-insert */
                INTO %s.pm_coupon_prod (coupon_id, prod_id, site_id, reg_date)
                SELECT DISTINCT ci.coupon_id, p.prod_id, ci.site_id, NOW()
                FROM %s.pm_coupon_item ci
                JOIN %s.pm_coupon c ON c.coupon_id = ci.coupon_id
                JOIN %s.pd_prod   p ON (
                    (ci.target_type_cd = 'PRODUCT'  AND p.prod_id    = ci.target_id)
                 OR (ci.target_type_cd = 'BRAND'    AND p.brand_id   = ci.target_id)
                 OR (ci.target_type_cd = 'VENDOR'   AND p.vendor_id  = ci.target_id)
                 OR (ci.target_type_cd = 'CATEGORY' AND p.prod_id IN (
                        SELECT cp2.prod_id FROM %s.pd_category_prod cp2
                        WHERE cp2.category_id = ci.target_id
                    ))
                )
                WHERE c.use_yn = 'Y'
                  AND c.coupon_status_cd <> 'EXPIRED'
                  AND (c.valid_to IS NULL OR c.valid_to >= :today)
                  AND p.use_yn = 'Y'
                ON CONFLICT (coupon_id, prod_id) DO NOTHING
                """.formatted(S, S, S, S, S))
            .setParameter("today", today)
            .executeUpdate();

        // 처리한 프로모션 수
        Object promoCount = em.createNativeQuery("""
                SELECT COUNT(DISTINCT coupon_id) /* sch :: PromoTargetExpandJob :: expandCoupon-count */
                FROM %s.pm_coupon_prod
                """.formatted(S))
            .getSingleResult();

        log.debug("[{}] 쿠폰: deleted={} inserted={} promos={}", batchCode(), deleted, inserted, promoCount);
        return new int[]{((Number) promoCount).intValue(), inserted};
    }

    // ── 할인 ─────────────────────────────────────────────────────────────────

    /** @return [promoCount, prodRowCount] */
    private int[] expandDiscnt(LocalDate today) {
        int deleted = em.createNativeQuery("""
                DELETE /* sch :: PromoTargetExpandJob :: expandDiscnt-delete */
                FROM %s.pm_discnt_prod dp
                WHERE dp.discnt_id IN (
                    SELECT d.discnt_id FROM %s.pm_discnt d
                    WHERE d.use_yn = 'Y'
                      AND (d.end_date IS NULL OR d.end_date >= :today)
                )
                """.formatted(S, S))
            .setParameter("today", today)
            .executeUpdate();

        int inserted = em.createNativeQuery("""
                INSERT /* sch :: PromoTargetExpandJob :: expandDiscnt-insert */
                INTO %s.pm_discnt_prod (discnt_id, prod_id, site_id, reg_date)
                SELECT DISTINCT di.discnt_id, p.prod_id, di.site_id, NOW()
                FROM %s.pm_discnt_item di
                JOIN %s.pm_discnt d ON d.discnt_id = di.discnt_id
                JOIN %s.pd_prod   p ON (
                    (di.target_type_cd = 'PRODUCT'  AND p.prod_id    = di.target_id)
                 OR (di.target_type_cd = 'BRAND'    AND p.brand_id   = di.target_id)
                 OR (di.target_type_cd = 'VENDOR'   AND p.vendor_id  = di.target_id)
                 OR (di.target_type_cd = 'CATEGORY' AND p.prod_id IN (
                        SELECT cp2.prod_id FROM %s.pd_category_prod cp2
                        WHERE cp2.category_id = di.target_id
                    ))
                )
                WHERE d.use_yn = 'Y'
                  AND (d.end_date IS NULL OR d.end_date >= :today)
                  AND p.use_yn = 'Y'
                ON CONFLICT (discnt_id, prod_id) DO NOTHING
                """.formatted(S, S, S, S, S))
            .setParameter("today", today)
            .executeUpdate();

        Object promoCount = em.createNativeQuery("""
                SELECT COUNT(DISTINCT discnt_id) /* sch :: PromoTargetExpandJob :: expandDiscnt-count */
                FROM %s.pm_discnt_prod
                """.formatted(S))
            .getSingleResult();

        log.debug("[{}] 할인: deleted={} inserted={} promos={}", batchCode(), deleted, inserted, promoCount);
        return new int[]{((Number) promoCount).intValue(), inserted};
    }

    // ── 이벤트 ───────────────────────────────────────────────────────────────

    /** @return [promoCount, prodRowCount] */
    private int[] expandEvent(LocalDate today) {
        int deleted = em.createNativeQuery("""
                DELETE /* sch :: PromoTargetExpandJob :: expandEvent-delete */
                FROM %s.pm_event_prod ep
                WHERE ep.event_id IN (
                    SELECT e.event_id FROM %s.pm_event e
                    WHERE e.use_yn = 'Y'
                      AND e.event_status_cd IN ('PENDING', 'ACTIVE')
                      AND (e.end_date IS NULL OR e.end_date >= :today)
                )
                """.formatted(S, S))
            .setParameter("today", today)
            .executeUpdate();

        int inserted = em.createNativeQuery("""
                INSERT /* sch :: PromoTargetExpandJob :: expandEvent-insert */
                INTO %s.pm_event_prod (event_id, prod_id, site_id, reg_date)
                SELECT DISTINCT ei.event_id, p.prod_id, ei.site_id, NOW()
                FROM %s.pm_event_item ei
                JOIN %s.pm_event e ON e.event_id = ei.event_id
                JOIN %s.pd_prod  p ON (
                    (ei.target_type_cd = 'PRODUCT'  AND p.prod_id    = ei.target_id)
                 OR (ei.target_type_cd = 'BRAND'    AND p.brand_id   = ei.target_id)
                 OR (ei.target_type_cd = 'VENDOR'   AND p.vendor_id  = ei.target_id)
                 OR (ei.target_type_cd = 'CATEGORY' AND p.prod_id IN (
                        SELECT cp2.prod_id FROM %s.pd_category_prod cp2
                        WHERE cp2.category_id = ei.target_id
                    ))
                )
                WHERE e.use_yn = 'Y'
                  AND e.event_status_cd IN ('PENDING', 'ACTIVE')
                  AND (e.end_date IS NULL OR e.end_date >= :today)
                  AND p.use_yn = 'Y'
                ON CONFLICT (event_id, prod_id) DO NOTHING
                """.formatted(S, S, S, S, S))
            .setParameter("today", today)
            .executeUpdate();

        Object promoCount = em.createNativeQuery("""
                SELECT COUNT(DISTINCT event_id) /* sch :: PromoTargetExpandJob :: expandEvent-count */
                FROM %s.pm_event_prod
                """.formatted(S))
            .getSingleResult();

        log.debug("[{}] 이벤트: deleted={} inserted={} promos={}", batchCode(), deleted, inserted, promoCount);
        return new int[]{((Number) promoCount).intValue(), inserted};
    }

    // ── 적립금 ───────────────────────────────────────────────────────────────

    /** @return [promoCount, prodRowCount] */
    private int[] expandSave(LocalDate today) {
        int deleted = em.createNativeQuery("""
                DELETE /* sch :: PromoTargetExpandJob :: expandSave-delete */
                FROM %s.pm_save_prod sp
                WHERE sp.save_id IN (
                    SELECT sv.save_id FROM %s.pm_save sv
                    WHERE sv.use_yn = 'Y'
                      AND (sv.end_date IS NULL OR sv.end_date >= :today)
                )
                """.formatted(S, S))
            .setParameter("today", today)
            .executeUpdate();

        int inserted = em.createNativeQuery("""
                INSERT /* sch :: PromoTargetExpandJob :: expandSave-insert */
                INTO %s.pm_save_prod (save_id, prod_id, site_id, reg_date)
                SELECT DISTINCT si.save_id, p.prod_id, si.site_id, NOW()
                FROM %s.pm_save_item si
                JOIN %s.pm_save  sv ON sv.save_id = si.save_id
                JOIN %s.pd_prod   p ON (
                    (si.target_type_cd = 'PRODUCT'  AND p.prod_id    = si.target_id)
                 OR (si.target_type_cd = 'BRAND'    AND p.brand_id   = si.target_id)
                 OR (si.target_type_cd = 'VENDOR'   AND p.vendor_id  = si.target_id)
                 OR (si.target_type_cd = 'CATEGORY' AND p.prod_id IN (
                        SELECT cp2.prod_id FROM %s.pd_category_prod cp2
                        WHERE cp2.category_id = si.target_id
                    ))
                )
                WHERE sv.use_yn = 'Y'
                  AND (sv.end_date IS NULL OR sv.end_date >= :today)
                  AND p.use_yn = 'Y'
                ON CONFLICT (save_id, prod_id) DO NOTHING
                """.formatted(S, S, S, S, S))
            .setParameter("today", today)
            .executeUpdate();

        Object promoCount = em.createNativeQuery("""
                SELECT COUNT(DISTINCT save_id) /* sch :: PromoTargetExpandJob :: expandSave-count */
                FROM %s.pm_save_prod
                """.formatted(S))
            .getSingleResult();

        log.debug("[{}] 적립금: deleted={} inserted={} promos={}", batchCode(), deleted, inserted, promoCount);
        return new int[]{((Number) promoCount).intValue(), inserted};
    }
}
