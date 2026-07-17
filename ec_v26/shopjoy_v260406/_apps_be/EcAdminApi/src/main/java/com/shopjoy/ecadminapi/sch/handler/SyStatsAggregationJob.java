package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 일별/주별/월별 통계 데이터 사전 집계.
 * batch_code: STATS_AGGREGATION
 * cron: 0 0 * * * (매일 00:00)
 *
 * <p><b>집계 항목 (전일 기준)</b>:
 * <ol>
 *   <li><b>주문/매출</b> — 주문 건수, 결제 건수, 총 결제금액, 평균 주문금액, 유입채널별 건수</li>
 *   <li><b>클레임</b>  — 취소/반품/교환 건수, 클레임율</li>
 *   <li><b>상품</b>   — 판매 상위 10개 상품 (수량/금액 기준), 카테고리별 판매금액</li>
 *   <li><b>회원</b>   — 신규 가입, 탈퇴, 로그인, 등급별 분포, 성별 분포, 연령대 분포</li>
 *   <li><b>결제수단</b>— 수단별 결제 건수/금액</li>
 * </ol>
 *
 * <p>별도 통계 테이블이 없을 때는 집계 결과를 로그로 출력하고, 향후 st_daily_stats 등으로
 * UPSERT 하는 구조로 확장할 수 있도록 각 집계 메서드를 독립 단위로 분리한다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyStatsAggregationJob implements SchBatchJobHandler {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final String S = "shopjoy_2604";

    @PersistenceContext
    private EntityManager em;

    @Override
    public String batchCode() {
        return "STATS_AGGREGATION";
    }

    @Override
    @Transactional(readOnly = true)
    public void execute(SyBatch batch) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime dayStart = yesterday.atStartOfDay();
        LocalDateTime dayEnd   = yesterday.atTime(23, 59, 59);
        String dateLabel = yesterday.format(DATE_FMT);

        log.info("[{}] 통계 집계 시작 — 대상일: {}", batchCode(), dateLabel);

        try { aggregateOrderSales(dateLabel, dayStart, dayEnd); }
        catch (Exception e) { log.error("[{}] 주문/매출 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregateClaims(dateLabel, dayStart, dayEnd); }
        catch (Exception e) { log.error("[{}] 클레임 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregateTopProducts(dateLabel, dayStart, dayEnd); }
        catch (Exception e) { log.error("[{}] 상품 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregateCategoryRevenue(dateLabel, dayStart, dayEnd); }
        catch (Exception e) { log.error("[{}] 카테고리 매출 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregateMembers(dateLabel, dayStart, dayEnd); }
        catch (Exception e) { log.error("[{}] 회원 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregatePayMethods(dateLabel, dayStart, dayEnd); }
        catch (Exception e) { log.error("[{}] 결제수단 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregateAccessChannels(dateLabel, dayStart, dayEnd); }
        catch (Exception e) { log.error("[{}] 유입채널 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregateMemberGrades(dateLabel); }
        catch (Exception e) { log.error("[{}] 회원등급 분포 집계 실패: {}", batchCode(), e.getMessage(), e); }

        try { aggregateMemberDemographics(dateLabel); }
        catch (Exception e) { log.error("[{}] 회원 인구통계 집계 실패: {}", batchCode(), e.getMessage(), e); }

        log.info("[{}] 통계 집계 완료 — 대상일: {}", batchCode(), dateLabel);
    }

    /* ── 1. 주문/매출 ────────────────────────────────────────────────── */

    private void aggregateOrderSales(String dateLabel, LocalDateTime start, LocalDateTime end) {
        Long orderCount = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateOrderSales-count */
                       COUNT(*)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        Object[] salesRow = (Object[]) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateOrderSales-amt */
                       COALESCE(SUM(o.pay_amt), 0),
                       COALESCE(AVG(o.pay_amt), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        Long totalDiscount = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateOrderSales-discount */
                       COALESCE(SUM(o.total_discount_amt + o.coupon_discount_amt + o.cache_use_amt), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        Long totalShipping = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateOrderSales-shipping */
                       COALESCE(SUM(o.outbound_shipping_fee), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        Number totalAmt = (Number) salesRow[0];
        Number avgAmt   = (Number) salesRow[1];

        log.info("[{}][{}] ★ 주문/매출 — 주문 {}건 | 결제금액 {}원 | 평균 {}원 | 할인 {}원 | 배송료 {}원",
            batchCode(), dateLabel,
            orderCount,
            fmt(totalAmt.longValue()),
            fmt(avgAmt.longValue()),
            fmt(totalDiscount),
            fmt(totalShipping));
    }

    /* ── 2. 클레임 (취소/반품/교환) ─────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private void aggregateClaims(String dateLabel, LocalDateTime start, LocalDateTime end) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateClaims-byType */
                       c.claim_type_cd, COUNT(*)
                FROM %s.od_claim c
                WHERE c.reg_date BETWEEN :s AND :e
                GROUP BY c.claim_type_cd
                ORDER BY 2 DESC
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getResultList();

        long totalClaims = rows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();

        StringBuilder sb = new StringBuilder();
        for (Object[] r : rows) {
            sb.append(r[0]).append(":").append(r[1]).append("건 ");
        }

        Long orderCount = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateClaims-orderCount */
                       COUNT(*)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        double claimRate = orderCount > 0 ? (double) totalClaims / orderCount * 100 : 0.0;

        log.info("[{}][{}] ★ 클레임 — 총 {}건 [{}] | 클레임율 {}%",
            batchCode(), dateLabel, totalClaims, sb.toString().trim(),
            String.format("%.1f", claimRate));
    }

    /* ── 3. 판매 상위 상품 Top 10 ────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private void aggregateTopProducts(String dateLabel, LocalDateTime start, LocalDateTime end) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateTopProducts */
                       i.prod_id,
                       i.prod_nm,
                       SUM(i.qty)      AS total_qty,
                       SUM(i.item_amt) AS total_amt
                FROM %s.od_order_item i
                JOIN %s.od_order o ON o.order_id = i.order_id
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                GROUP BY i.prod_id, i.prod_nm
                ORDER BY total_qty DESC
                LIMIT 10
                """.formatted(S, S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getResultList();

        log.info("[{}][{}] ★ 판매 상위 상품 Top {}", batchCode(), dateLabel, rows.size());
        int rank = 1;
        for (Object[] r : rows) {
            log.info("[{}][{}]   {}위  {}  수량:{}개  매출:{}원",
                batchCode(), dateLabel, rank++, r[1],
                r[2], fmt(((Number) r[3]).longValue()));
        }
    }

    /* ── 4. 카테고리별 매출 ──────────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private void aggregateCategoryRevenue(String dateLabel, LocalDateTime start, LocalDateTime end) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateCategoryRevenue */
                       c.category_nm,
                       COUNT(DISTINCT o.order_id),
                       SUM(i.item_amt)
                FROM %s.od_order_item i
                JOIN      %s.od_order    o ON o.order_id    = i.order_id
                JOIN      %s.pd_prod     p ON p.prod_id     = i.prod_id
                LEFT JOIN %s.pd_category c ON c.category_id = p.category_id
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                GROUP BY c.category_nm
                ORDER BY 3 DESC
                LIMIT 10
                """.formatted(S, S, S, S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getResultList();

        log.info("[{}][{}] ★ 카테고리별 매출 Top {}", batchCode(), dateLabel, rows.size());
        for (Object[] r : rows) {
            log.info("[{}][{}]   [{}]  주문 {}건  매출 {}원",
                batchCode(), dateLabel, r[0], r[1], fmt(((Number) r[2]).longValue()));
        }
    }

    /* ── 5. 회원 현황 ────────────────────────────────────────────────── */

    private void aggregateMembers(String dateLabel, LocalDateTime start, LocalDateTime end) {
        Long joined = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateMembers-joined */
                       COUNT(*)
                FROM %s.mb_member m
                WHERE m.reg_date BETWEEN :s AND :e
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        Long withdrawn = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateMembers-withdrawn */
                       COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'WITHDRAWN'
                  AND m.upd_date BETWEEN :s AND :e
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        Long activeTotal = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateMembers-activeTotal */
                       COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'ACTIVE'
                """.formatted(S))
            .getSingleResult();

        Long loginCount = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateMembers-login */
                       COUNT(*)
                FROM %s.mbh_member_login_log l
                WHERE l.login_date BETWEEN :s AND :e
                  AND l.login_result = 'SUCCESS'
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getSingleResult();

        log.info("[{}][{}] ★ 회원 — 신규가입 {}명 | 탈퇴 {}명 | 활성누적 {}명 | 로그인 {}건",
            batchCode(), dateLabel, joined, withdrawn, activeTotal, loginCount);
    }

    /* ── 6. 결제수단별 통계 ──────────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private void aggregatePayMethods(String dateLabel, LocalDateTime start, LocalDateTime end) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregatePayMethods */
                       o.pay_method_cd,
                       COUNT(*),
                       COALESCE(SUM(o.pay_amt), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                GROUP BY o.pay_method_cd
                ORDER BY 2 DESC
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getResultList();

        StringBuilder sb = new StringBuilder();
        for (Object[] r : rows) {
            sb.append(r[0]).append(":").append(r[1]).append("건/")
              .append(fmt(((Number) r[2]).longValue())).append("원  ");
        }
        log.info("[{}][{}] ★ 결제수단 — {}", batchCode(), dateLabel, sb.toString().trim());
    }

    /* ── 7. 유입채널별 통계 ──────────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private void aggregateAccessChannels(String dateLabel, LocalDateTime start, LocalDateTime end) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateAccessChannels */
                       o.access_channel_cd,
                       COUNT(*),
                       COALESCE(SUM(o.pay_amt), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                GROUP BY o.access_channel_cd
                ORDER BY 2 DESC
                """.formatted(S))
            .setParameter("s", start)
            .setParameter("e", end)
            .getResultList();

        StringBuilder sb = new StringBuilder();
        for (Object[] r : rows) {
            sb.append(r[0]).append(":").append(r[1]).append("건/")
              .append(fmt(((Number) r[2]).longValue())).append("원  ");
        }
        log.info("[{}][{}] ★ 유입채널 — {}", batchCode(), dateLabel, sb.toString().trim());
    }

    /* ── 8. 회원 등급 분포 (누적) ────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private void aggregateMemberGrades(String dateLabel) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateMemberGrades */
                       m.grade_cd, COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'ACTIVE'
                GROUP BY m.grade_cd
                ORDER BY 2 DESC
                """.formatted(S))
            .getResultList();

        StringBuilder sb = new StringBuilder();
        for (Object[] r : rows) {
            sb.append(r[0]).append(":").append(r[1]).append("명  ");
        }
        log.info("[{}][{}] ★ 회원등급 분포 — {}", batchCode(), dateLabel, sb.toString().trim());
    }

    /* ── 9. 회원 인구통계 (성별/연령대, 누적) ───────────────────────── */

    @SuppressWarnings("unchecked")
    private void aggregateMemberDemographics(String dateLabel) {
        List<Object[]> genderRows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateMemberDemographics-gender */
                       COALESCE(m.member_gender, '?'), COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'ACTIVE'
                GROUP BY m.member_gender
                ORDER BY 2 DESC
                """.formatted(S))
            .getResultList();

        StringBuilder gSb = new StringBuilder();
        for (Object[] r : genderRows) {
            gSb.append(r[0]).append(":").append(r[1]).append("명  ");
        }

        List<Object[]> ageRows = em.createNativeQuery("""
                SELECT /* sch :: StatsAggregationJob :: aggregateMemberDemographics-age */
                    CASE
                        WHEN EXTRACT(YEAR FROM AGE(m.birth_date)) < 20 THEN '10대'
                        WHEN EXTRACT(YEAR FROM AGE(m.birth_date)) < 30 THEN '20대'
                        WHEN EXTRACT(YEAR FROM AGE(m.birth_date)) < 40 THEN '30대'
                        WHEN EXTRACT(YEAR FROM AGE(m.birth_date)) < 50 THEN '40대'
                        WHEN EXTRACT(YEAR FROM AGE(m.birth_date)) < 60 THEN '50대'
                        WHEN m.birth_date IS NOT NULL                   THEN '60대+'
                        ELSE '미입력'
                    END AS age_group,
                    COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'ACTIVE'
                GROUP BY age_group
                ORDER BY 2 DESC
                """.formatted(S))
            .getResultList();

        StringBuilder aSb = new StringBuilder();
        for (Object[] r : ageRows) {
            aSb.append(r[0]).append(":").append(r[1]).append("명  ");
        }

        log.info("[{}][{}] ★ 회원 성별 분포 — {}", batchCode(), dateLabel, gSb.toString().trim());
        log.info("[{}][{}] ★ 회원 연령대 분포 — {}", batchCode(), dateLabel, aSb.toString().trim());
    }

    /* ── 유틸 ──────────────────────────────────────────────────────────── */

    private static String fmt(long v) {
        return String.format("%,d", v);
    }
}
