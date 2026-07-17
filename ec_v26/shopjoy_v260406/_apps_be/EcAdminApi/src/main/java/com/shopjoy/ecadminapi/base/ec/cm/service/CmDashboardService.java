package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmDashboardDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboard;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemDataRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EC 종합 대시보드 서비스 — cm_dashboard + cm_dashboard_item + cm_dashboard_item_data 기반.
 *
 * <p>요청 목록 [{compId, siteId, uiNm, startYmd, endYmd, limit}] 를 받아
 * 각 항목을 병렬 조회하여 {@code info{NNNN}} 키로 Map에 담아 반환한다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardService {

    private static final String SCHEMA = "shopjoy_2604";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final CmDashboardRepository cmDashboardRepository;
    private final CmDashboardItemRepository cmDashboardItemRepository;
    private final CmDashboardItemDataRepository cmDashboardItemDataRepository;

    @PersistenceContext
    private EntityManager em;

    /**
     * 대시보드 데이터 조회.
     *
     * @param items [{compId: "COMP0101", siteId: "2604010000000001", uiNm: "DashboardBoEc01",
     *               startYmd: "20250501", endYmd: "20260624"}, ...]
     * @return {"info0101": [...], "info0202": [...], ...}
     */
    public Map<String, Object> getDashboard(List<Map<String, Object>> items) {
        Map<String, Object> result = new ConcurrentHashMap<>();
        List<CompletableFuture<Void>> futures = items.stream()
            .map(item -> CompletableFuture.runAsync(() -> {
                String compId = String.valueOf(item.get("compId"));
                String key = "info" + compId.substring(4); // COMP0101 → info0101
                result.put(key, queryOne(compId, item));
            }))
            .toList();
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        return result;
    }

    private List<CmDashboardDto> queryOne(String compId, Map<String, Object> p) {
        String siteId = str(p.get("siteId"));
        String uiNm   = str(p.get("uiNm"));

        // cm_dashboard 헤더로 dashboardId 조회
        String dashboardId = null;
        if (siteId != null && uiNm != null) {
            CmDashboard dash = cmDashboardRepository.findBySiteIdAndUiCompNm(siteId, uiNm).orElse(null);
            if (dash != null) dashboardId = dash.getDashboardId();
        }

        // 패널 목록 조회
        List<CmDashboardItem> itemList;
        if (dashboardId != null) {
            itemList = cmDashboardItemRepository.findByDashboardIdOrderBySortOrdAsc(dashboardId);
        } else if (siteId != null) {
            itemList = cmDashboardItemRepository.findBySiteIdOrderBySortOrdAsc(siteId);
        } else {
            itemList = cmDashboardItemRepository.findAll();
        }

        CmDashboardItem panel = itemList.stream()
            .filter(i -> compId.equals(i.getItemKey()))
            .findFirst().orElse(null);

        if (panel == null) return List.of();

        // cm_dashboard_item_data에서 해당 패널의 데이터 조회
        String startYmd = str(p.get("startYmd"));
        String endYmd   = str(p.get("endYmd"));
        Object limitObj = p.get("limit");

        List<CmDashboardItemData> rows;
        if (startYmd != null && endYmd != null) {
            rows = cmDashboardItemDataRepository
                .findBySiteIdAndDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscItemDataIdAsc(
                    panel.getSiteId(), panel.getDashboardItemId(), startYmd, endYmd);
        } else {
            rows = cmDashboardItemDataRepository
                .findBySiteIdAndDashboardItemIdOrderByYyyymmddAscItemDataIdAsc(
                    panel.getSiteId(), panel.getDashboardItemId());
        }

        if (limitObj instanceof Number n) {
            rows = rows.stream().limit(n.longValue()).toList();
        }

        return rows.stream().map(this::toDto).toList();
    }

    private CmDashboardDto toDto(CmDashboardItemData d) {
        return CmDashboardDto.builder()
            .dashboardId(d.getItemDataId())
            .compId(d.getItemKey())
            .yyyymmdd(d.getYyyymmdd())
            .siteNo(d.getSiteId())
            .uiNm(d.getUiNm())
            .deptId(d.getDeptId())
            .userId(d.getUserId())
            .col1Nm(d.getCol1Nm()).col1Num(d.getCol1Num())
            .col2Nm(d.getCol2Nm()).col2Num(d.getCol2Num())
            .col3Nm(d.getCol3Nm()).col3Num(d.getCol3Num())
            .col4Nm(d.getCol4Nm()).col4Num(d.getCol4Num())
            .col5Nm(d.getCol5Nm()).col5Num(d.getCol5Num())
            .col6Nm(d.getCol6Nm()).col6Num(d.getCol6Num())
            .col7Nm(d.getCol7Nm()).col7Num(d.getCol7Num())
            .col8Nm(d.getCol8Nm()).col8Num(d.getCol8Num())
            .col9Nm(d.getCol9Nm()).col9Num(d.getCol9Num())
            .build();
    }

    /**
     * 일별 현황 집계 — StatsAggregationJob 과 동일한 쿼리를 온디맨드로 실행하여 반환.
     *
     * @param targetDate 대상 날짜 (null 이면 어제)
     * @return { dateLabel, orderCount, totalAmt, avgAmt, totalDiscount, totalShipping,
     *           totalClaims, claimRate, newMembers, withdrawnMembers, activeMembers, loginCount,
     *           topProducts:[{rank,prodNm,qty,amt}],
     *           payMethods:[{method,count,amt}],
     *           categories:[{categoryNm,orderCount,amt}] }
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getDailyStats(LocalDate targetDate) {
        LocalDate date     = targetDate != null ? targetDate : LocalDate.now().minusDays(1);
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end   = date.atTime(23, 59, 59);
        String dateLabel    = date.format(DATE_FMT);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dateLabel", dateLabel);

        /* ── 주문/매출 ── */
        try {
            Long orderCount = (Long) em.createNativeQuery(
                "SELECT COUNT(*) FROM " + SCHEMA + ".od_order o" +
                " WHERE o.order_date BETWEEN :s AND :e" +
                "   AND o.order_status_cd NOT IN ('PENDING','CANCEL')" +
                "   AND o.simul_yn = 'N'")
                .setParameter("s", start).setParameter("e", end)
                .getSingleResult();

            Object[] salesRow = (Object[]) em.createNativeQuery(
                "SELECT COALESCE(SUM(o.pay_amt),0), COALESCE(AVG(o.pay_amt),0)" +
                " FROM " + SCHEMA + ".od_order o" +
                " WHERE o.order_date BETWEEN :s AND :e" +
                "   AND o.order_status_cd NOT IN ('PENDING','CANCEL')" +
                "   AND o.simul_yn = 'N'")
                .setParameter("s", start).setParameter("e", end)
                .getSingleResult();

            Long totalDiscount = (Long) em.createNativeQuery(
                "SELECT COALESCE(SUM(o.total_discount_amt + o.coupon_discount_amt + o.cache_use_amt),0)" +
                " FROM " + SCHEMA + ".od_order o" +
                " WHERE o.order_date BETWEEN :s AND :e" +
                "   AND o.order_status_cd NOT IN ('PENDING','CANCEL')" +
                "   AND o.simul_yn = 'N'")
                .setParameter("s", start).setParameter("e", end)
                .getSingleResult();

            Long totalShipping = (Long) em.createNativeQuery(
                "SELECT COALESCE(SUM(o.outbound_shipping_fee),0)" +
                " FROM " + SCHEMA + ".od_order o" +
                " WHERE o.order_date BETWEEN :s AND :e" +
                "   AND o.order_status_cd NOT IN ('PENDING','CANCEL')" +
                "   AND o.simul_yn = 'N'")
                .setParameter("s", start).setParameter("e", end)
                .getSingleResult();

            result.put("orderCount",     orderCount);
            result.put("totalAmt",       ((Number) salesRow[0]).longValue());
            result.put("avgAmt",         ((Number) salesRow[1]).longValue());
            result.put("totalDiscount",  totalDiscount);
            result.put("totalShipping",  totalShipping);
        } catch (Exception e) {
            result.put("orderError", e.getMessage());
        }

        /* ── 클레임 ── */
        try {
            List<Object[]> claimRows = em.createNativeQuery(
                "SELECT c.claim_type_cd, COUNT(*)" +
                " FROM " + SCHEMA + ".od_claim c" +
                " WHERE c.reg_date BETWEEN :s AND :e" +
                " GROUP BY c.claim_type_cd ORDER BY 2 DESC")
                .setParameter("s", start).setParameter("e", end)
                .getResultList();

            long totalClaims = claimRows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
            Long orderCount2 = (Long) em.createNativeQuery(
                "SELECT COUNT(*) FROM " + SCHEMA + ".od_order o" +
                " WHERE o.order_date BETWEEN :s AND :e AND o.simul_yn='N'")
                .setParameter("s", start).setParameter("e", end)
                .getSingleResult();
            double claimRate = orderCount2 > 0 ? (double) totalClaims / orderCount2 * 100 : 0.0;

            List<Map<String, Object>> claimList = new ArrayList<>();
            for (Object[] r : claimRows) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("type",  r[0]);
                m.put("count", ((Number) r[1]).longValue());
                claimList.add(m);
            }
            result.put("totalClaims", totalClaims);
            result.put("claimRate",   Math.round(claimRate * 10.0) / 10.0);
            result.put("claimByType", claimList);
        } catch (Exception e) {
            result.put("claimError", e.getMessage());
        }

        /* ── 회원 ── */
        try {
            Long joined = (Long) em.createNativeQuery(
                "SELECT COUNT(*) FROM " + SCHEMA + ".mb_member m WHERE m.reg_date BETWEEN :s AND :e")
                .setParameter("s", start).setParameter("e", end).getSingleResult();
            Long withdrawn = (Long) em.createNativeQuery(
                "SELECT COUNT(*) FROM " + SCHEMA + ".mb_member m" +
                " WHERE m.member_status_cd='WITHDRAWN' AND m.upd_date BETWEEN :s AND :e")
                .setParameter("s", start).setParameter("e", end).getSingleResult();
            Long activeTotal = (Long) em.createNativeQuery(
                "SELECT COUNT(*) FROM " + SCHEMA + ".mb_member m WHERE m.member_status_cd='ACTIVE'")
                .getSingleResult();
            Long loginCount = (Long) em.createNativeQuery(
                "SELECT COUNT(*) FROM " + SCHEMA + ".mbh_member_login_log l" +
                " WHERE l.login_date BETWEEN :s AND :e AND l.login_result='SUCCESS'")
                .setParameter("s", start).setParameter("e", end).getSingleResult();
            result.put("newMembers",       joined);
            result.put("withdrawnMembers", withdrawn);
            result.put("activeMembers",    activeTotal);
            result.put("loginCount",       loginCount);
        } catch (Exception e) {
            result.put("memberError", e.getMessage());
        }

        /* ── 판매 상위 상품 Top 10 ── */
        try {
            List<Object[]> prodRows = em.createNativeQuery(
                "SELECT i.prod_id, i.prod_nm, SUM(i.qty) AS total_qty, SUM(i.item_amt) AS total_amt" +
                " FROM " + SCHEMA + ".od_order_item i" +
                " JOIN " + SCHEMA + ".od_order o ON o.order_id = i.order_id" +
                " WHERE o.order_date BETWEEN :s AND :e" +
                "   AND o.order_status_cd NOT IN ('PENDING','CANCEL') AND o.simul_yn='N'" +
                " GROUP BY i.prod_id, i.prod_nm ORDER BY total_qty DESC LIMIT 10")
                .setParameter("s", start).setParameter("e", end).getResultList();

            List<Map<String, Object>> prodList = new ArrayList<>();
            int rank = 1;
            for (Object[] r : prodRows) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("rank",   rank++);
                m.put("prodId", r[0]);
                m.put("prodNm", r[1]);
                m.put("qty",    ((Number) r[2]).longValue());
                m.put("amt",    ((Number) r[3]).longValue());
                prodList.add(m);
            }
            result.put("topProducts", prodList);
        } catch (Exception e) {
            result.put("topProductsError", e.getMessage());
        }

        /* ── 결제수단별 ── */
        try {
            List<Object[]> payRows = em.createNativeQuery(
                "SELECT o.pay_method_cd, COUNT(*), COALESCE(SUM(o.pay_amt),0)" +
                " FROM " + SCHEMA + ".od_order o" +
                " WHERE o.order_date BETWEEN :s AND :e" +
                "   AND o.order_status_cd NOT IN ('PENDING','CANCEL') AND o.simul_yn='N'" +
                " GROUP BY o.pay_method_cd ORDER BY 2 DESC")
                .setParameter("s", start).setParameter("e", end).getResultList();

            List<Map<String, Object>> payList = new ArrayList<>();
            for (Object[] r : payRows) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("method", r[0]);
                m.put("count",  ((Number) r[1]).longValue());
                m.put("amt",    ((Number) r[2]).longValue());
                payList.add(m);
            }
            result.put("payMethods", payList);
        } catch (Exception e) {
            result.put("payMethodsError", e.getMessage());
        }

        /* ── 카테고리별 매출 ── */
        try {
            List<Object[]> catRows = em.createNativeQuery(
                "SELECT c.category_nm, COUNT(DISTINCT o.order_id), SUM(i.item_amt)" +
                " FROM " + SCHEMA + ".od_order_item i" +
                " JOIN " + SCHEMA + ".od_order o ON o.order_id = i.order_id" +
                " JOIN " + SCHEMA + ".pd_prod p ON p.prod_id = i.prod_id" +
                " LEFT JOIN " + SCHEMA + ".pd_category c ON c.category_id = p.category_id" +
                " WHERE o.order_date BETWEEN :s AND :e" +
                "   AND o.order_status_cd NOT IN ('PENDING','CANCEL') AND o.simul_yn='N'" +
                " GROUP BY c.category_nm ORDER BY 3 DESC LIMIT 10")
                .setParameter("s", start).setParameter("e", end).getResultList();

            List<Map<String, Object>> catList = new ArrayList<>();
            for (Object[] r : catRows) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("categoryNm",  r[0]);
                m.put("orderCount",  ((Number) r[1]).longValue());
                m.put("amt",         ((Number) r[2]).longValue());
                catList.add(m);
            }
            result.put("categories", catList);
        } catch (Exception e) {
            result.put("categoriesError", e.getMessage());
        }

        return result;
    }

    private static String str(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isBlank() ? null : s;
    }
}
