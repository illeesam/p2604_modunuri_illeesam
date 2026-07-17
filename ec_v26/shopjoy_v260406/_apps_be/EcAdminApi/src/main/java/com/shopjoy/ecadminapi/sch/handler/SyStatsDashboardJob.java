package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemDataRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.common.util.CmUtil;
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
import java.util.Map;
import java.util.Optional;

/**
 * 대시보드 차트 데이터 생성 배치 — cm_dashboard_item_data UPSERT.
 * batch_code: STATS_DASHBOARD
 * cron: 5 0 * * * (매일 00:05 — STATS_AGGREGATION 이후)
 *
 * <p>전일 기준 집계값을 cm_dashboard_item_data 에 날짜별 UPSERT 한다.
 * 대시보드 차트(DashboardBoEc01~03)가 이 테이블을 직접 읽는다.</p>
 *
 * <p>패널 키(itemKey) 매핑:
 * <ul>
 *   <li>COMP0101 — 일별 주문/매출 (col1:주문건수, col2:결제금액, col3:평균주문금액)</li>
 *   <li>COMP0102 — 일별 할인/배송료 (col1:할인금액, col2:배송료)</li>
 *   <li>COMP0201 — 일별 클레임 (col1:총클레임, col2:취소, col3:반품, col4:교환, col5:클레임율)</li>
 *   <li>COMP0301 — 일별 회원 (col1:신규가입, col2:탈퇴, col3:활성누적, col4:로그인)</li>
 *   <li>COMP0302 — 회원등급 분포 (col1~N: 등급별 명수, data_json: [{name,value}])</li>
 *   <li>COMP0401 — 결제수단별 (data_json: [{method,count,amt}])</li>
 *   <li>COMP0402 — 카테고리별 매출 (data_json: [{categoryNm,orderCount,amt}])</li>
 *   <li>COMP0403 — 판매 상위 상품 Top10 (data_json: [{rank,prodNm,qty,amt}])</li>
 * </ul>
 * </p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyStatsDashboardJob implements SchBatchJobHandler {

    private static final DateTimeFormatter YMD_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String S    = "shopjoy_2604";
    private static final String SITE = "2604010000000001";
    private static final String UI   = "DashboardBoEc01";

    private final CmDashboardItemRepository     itemRepo;
    private final CmDashboardItemDataRepository dataRepo;

    @PersistenceContext
    private EntityManager em;

    @Override
    public String batchCode() { return "STATS_DASHBOARD"; }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDate yesterday  = LocalDate.now().minusDays(1);
        String    yyyymmdd   = yesterday.format(YMD_FMT);
        LocalDateTime start  = yesterday.atStartOfDay();
        LocalDateTime end    = yesterday.atTime(23, 59, 59);

        log.info("[{}] 대시보드 데이터 생성 시작 — 대상일: {}", batchCode(), yyyymmdd);

        /* 패널 목록을 한 번에 로드 (siteId + uiNm 기준) */
        List<CmDashboardItem> panels = itemRepo.findBySiteIdOrderBySortOrdAsc(SITE);
        if (panels.isEmpty()) {
            log.warn("[{}] cm_dashboard_item 에 패널 정의가 없습니다 (siteId={})", batchCode(), SITE);
            return;
        }

        /* 패널키 → 패널 ID 빠른 조회용 Map */
        Map<String, CmDashboardItem> panelMap = new java.util.HashMap<>();
        for (CmDashboardItem p : panels) panelMap.put(p.getItemKey(), p);

        int saved = 0;

        /* ── 주문/매출 (COMP0101) ── */
        try {
            saved += upsertOrderSales(panelMap, yyyymmdd, start, end);
        } catch (Exception e) {
            log.error("[{}] COMP0101 주문/매출 실패: {}", batchCode(), e.getMessage(), e);
        }

        /* ── 할인/배송료 (COMP0102) ── */
        try {
            saved += upsertDiscountShipping(panelMap, yyyymmdd, start, end);
        } catch (Exception e) {
            log.error("[{}] COMP0102 할인/배송료 실패: {}", batchCode(), e.getMessage(), e);
        }

        /* ── 클레임 (COMP0201) ── */
        try {
            saved += upsertClaims(panelMap, yyyymmdd, start, end);
        } catch (Exception e) {
            log.error("[{}] COMP0201 클레임 실패: {}", batchCode(), e.getMessage(), e);
        }

        /* ── 회원 현황 (COMP0301) ── */
        try {
            saved += upsertMembers(panelMap, yyyymmdd, start, end);
        } catch (Exception e) {
            log.error("[{}] COMP0301 회원 실패: {}", batchCode(), e.getMessage(), e);
        }

        /* ── 회원 등급 분포 (COMP0302) ── */
        try {
            saved += upsertMemberGrades(panelMap, yyyymmdd);
        } catch (Exception e) {
            log.error("[{}] COMP0302 회원등급 실패: {}", batchCode(), e.getMessage(), e);
        }

        /* ── 결제수단별 (COMP0401) ── */
        try {
            saved += upsertPayMethods(panelMap, yyyymmdd, start, end);
        } catch (Exception e) {
            log.error("[{}] COMP0401 결제수단 실패: {}", batchCode(), e.getMessage(), e);
        }

        /* ── 카테고리별 매출 (COMP0402) ── */
        try {
            saved += upsertCategories(panelMap, yyyymmdd, start, end);
        } catch (Exception e) {
            log.error("[{}] COMP0402 카테고리 실패: {}", batchCode(), e.getMessage(), e);
        }

        /* ── 판매 상위 상품 Top10 (COMP0403) ── */
        try {
            saved += upsertTopProducts(panelMap, yyyymmdd, start, end);
        } catch (Exception e) {
            log.error("[{}] COMP0403 판매상위상품 실패: {}", batchCode(), e.getMessage(), e);
        }

        log.info("[{}] 대시보드 데이터 생성 완료 — 대상일: {} | UPSERT {}건", batchCode(), yyyymmdd, saved);
    }

    /* ── COMP0101: 주문/매출 ─────────────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private int upsertOrderSales(Map<String, CmDashboardItem> panels, String yyyymmdd,
                                 LocalDateTime start, LocalDateTime end) {
        CmDashboardItem panel = panels.get("COMP0101");
        if (panel == null) return 0;

        Long orderCount = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertOrderSales-count */
                       COUNT(*)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();

        Object[] salesRow = (Object[]) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertOrderSales-amt */
                       COALESCE(SUM(o.pay_amt), 0),
                       COALESCE(AVG(o.pay_amt), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setCol1Nm("주문건수");  row.setCol1Num(orderCount.doubleValue());
        row.setCol2Nm("결제금액");  row.setCol2Num(((Number) salesRow[0]).doubleValue());
        row.setCol3Nm("평균주문금액"); row.setCol3Num(((Number) salesRow[1]).doubleValue());
        dataRepo.save(row);
        return 1;
    }

    /* ── COMP0102: 할인/배송료 ───────────────────────────────────────────── */

    private int upsertDiscountShipping(Map<String, CmDashboardItem> panels, String yyyymmdd,
                                       LocalDateTime start, LocalDateTime end) {
        CmDashboardItem panel = panels.get("COMP0102");
        if (panel == null) return 0;

        Long discount = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertDiscountShipping-discount */
                       COALESCE(SUM(o.total_discount_amt + o.coupon_discount_amt + o.cache_use_amt), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();

        Long shipping = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertDiscountShipping-shipping */
                       COALESCE(SUM(o.outbound_shipping_fee), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setCol1Nm("할인금액");  row.setCol1Num(discount.doubleValue());
        row.setCol2Nm("배송료");    row.setCol2Num(shipping.doubleValue());
        dataRepo.save(row);
        return 1;
    }

    /* ── COMP0201: 클레임 ────────────────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private int upsertClaims(Map<String, CmDashboardItem> panels, String yyyymmdd,
                             LocalDateTime start, LocalDateTime end) {
        CmDashboardItem panel = panels.get("COMP0201");
        if (panel == null) return 0;

        List<Object[]> claimRows = em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertClaims-byType */
                       c.claim_type_cd,
                       COUNT(*)
                FROM %s.od_claim c
                WHERE c.reg_date BETWEEN :s AND :e
                GROUP BY c.claim_type_cd
                ORDER BY 2 DESC
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getResultList();

        Long orderCount = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertClaims-orderCount */
                       COUNT(*)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.simul_yn = 'N'
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();

        long total   = claimRows.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        long cancel  = claimRows.stream().filter(r -> "CANCEL".equals(r[0])).mapToLong(r -> ((Number) r[1]).longValue()).sum();
        long refund  = claimRows.stream().filter(r -> "REFUND".equals(r[0])).mapToLong(r -> ((Number) r[1]).longValue()).sum();
        long exchange = claimRows.stream().filter(r -> "EXCHANGE".equals(r[0])).mapToLong(r -> ((Number) r[1]).longValue()).sum();
        double rate  = orderCount > 0 ? Math.round((double) total / orderCount * 1000.0) / 10.0 : 0.0;

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setCol1Nm("총클레임");  row.setCol1Num((double) total);
        row.setCol2Nm("취소");      row.setCol2Num((double) cancel);
        row.setCol3Nm("반품");      row.setCol3Num((double) refund);
        row.setCol4Nm("교환");      row.setCol4Num((double) exchange);
        row.setCol5Nm("클레임율%"); row.setCol5Num(rate);
        dataRepo.save(row);
        return 1;
    }

    /* ── COMP0301: 회원 현황 ─────────────────────────────────────────────── */

    private int upsertMembers(Map<String, CmDashboardItem> panels, String yyyymmdd,
                              LocalDateTime start, LocalDateTime end) {
        CmDashboardItem panel = panels.get("COMP0301");
        if (panel == null) return 0;

        Long joined = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertMembers-joined */
                       COUNT(*)
                FROM %s.mb_member m
                WHERE m.reg_date BETWEEN :s AND :e
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();
        Long withdrawn = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertMembers-withdrawn */
                       COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'WITHDRAWN'
                  AND m.upd_date BETWEEN :s AND :e
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();
        Long active = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertMembers-active */
                       COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'ACTIVE'
                """.formatted(S))
            .getSingleResult();
        Long login = (Long) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertMembers-login */
                       COUNT(*)
                FROM %s.mbh_member_login_log l
                WHERE l.login_date BETWEEN :s AND :e
                  AND l.login_result = 'SUCCESS'
                """.formatted(S))
            .setParameter("s", start).setParameter("e", end).getSingleResult();

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setCol1Nm("신규가입");  row.setCol1Num(joined.doubleValue());
        row.setCol2Nm("탈퇴");      row.setCol2Num(withdrawn.doubleValue());
        row.setCol3Nm("활성누적");  row.setCol3Num(active.doubleValue());
        row.setCol4Nm("로그인");    row.setCol4Num(login.doubleValue());
        dataRepo.save(row);
        return 1;
    }

    /* ── COMP0302: 회원 등급 분포 ────────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private int upsertMemberGrades(Map<String, CmDashboardItem> panels, String yyyymmdd) {
        CmDashboardItem panel = panels.get("COMP0302");
        if (panel == null) return 0;

        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertMemberGrades */
                       m.grade_cd,
                       COUNT(*)
                FROM %s.mb_member m
                WHERE m.member_status_cd = 'ACTIVE'
                GROUP BY m.grade_cd
                ORDER BY 2 DESC
                """.formatted(S))
            .getResultList();

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) json.append(",");
            json.append("{\"name\":\"").append(rows.get(i)[0])
                .append("\",\"value\":").append(((Number) rows.get(i)[1]).longValue()).append("}");
        }
        json.append("]");

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setDataJson(json.toString());
        /* col1~col9 에도 최대 9등급까지 저장 (등급명/명수) */
        String[] nms  = {"col1Nm","col2Nm","col3Nm","col4Nm","col5Nm","col6Nm","col7Nm","col8Nm","col9Nm"};
        String[] nums = {"col1Num","col2Num","col3Num","col4Num","col5Num","col6Num","col7Num","col8Num","col9Num"};
        setColValues(row, rows, nms, nums);
        dataRepo.save(row);
        return 1;
    }

    /* ── COMP0401: 결제수단별 ────────────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private int upsertPayMethods(Map<String, CmDashboardItem> panels, String yyyymmdd,
                                 LocalDateTime start, LocalDateTime end) {
        CmDashboardItem panel = panels.get("COMP0401");
        if (panel == null) return 0;

        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertPayMethods */
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
            .setParameter("s", start).setParameter("e", end).getResultList();

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) json.append(",");
            json.append("{\"method\":\"").append(rows.get(i)[0])
                .append("\",\"count\":").append(((Number) rows.get(i)[1]).longValue())
                .append(",\"amt\":").append(((Number) rows.get(i)[2]).longValue()).append("}");
        }
        json.append("]");

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setDataJson(json.toString());
        dataRepo.save(row);
        return 1;
    }

    /* ── COMP0402: 카테고리별 매출 ───────────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private int upsertCategories(Map<String, CmDashboardItem> panels, String yyyymmdd,
                                 LocalDateTime start, LocalDateTime end) {
        CmDashboardItem panel = panels.get("COMP0402");
        if (panel == null) return 0;

        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertCategories */
                       c.category_nm,
                       COUNT(DISTINCT o.order_id),
                       SUM(i.item_amt)
                FROM %s.od_order_item i
                JOIN %s.od_order o ON o.order_id = i.order_id
                JOIN %s.pd_prod p ON p.prod_id = i.prod_id
                LEFT JOIN %s.pd_category c ON c.category_id = p.category_id
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                GROUP BY c.category_nm
                ORDER BY 3 DESC
                LIMIT 10
                """.formatted(S, S, S, S))
            .setParameter("s", start).setParameter("e", end).getResultList();

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) json.append(",");
            json.append("{\"categoryNm\":\"").append(rows.get(i)[0])
                .append("\",\"orderCount\":").append(((Number) rows.get(i)[1]).longValue())
                .append(",\"amt\":").append(((Number) rows.get(i)[2]).longValue()).append("}");
        }
        json.append("]");

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setDataJson(json.toString());
        dataRepo.save(row);
        return 1;
    }

    /* ── COMP0403: 판매 상위 상품 Top10 ─────────────────────────────────── */

    @SuppressWarnings("unchecked")
    private int upsertTopProducts(Map<String, CmDashboardItem> panels, String yyyymmdd,
                                  LocalDateTime start, LocalDateTime end) {
        CmDashboardItem panel = panels.get("COMP0403");
        if (panel == null) return 0;

        List<Object[]> rows = em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertTopProducts */
                       i.prod_id,
                       i.prod_nm,
                       SUM(i.qty),
                       SUM(i.item_amt)
                FROM %s.od_order_item i
                JOIN %s.od_order o ON o.order_id = i.order_id
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                GROUP BY i.prod_id, i.prod_nm
                ORDER BY 3 DESC
                LIMIT 10
                """.formatted(S, S))
            .setParameter("s", start).setParameter("e", end).getResultList();

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) json.append(",");
            json.append("{\"rank\":").append(i + 1)
                .append(",\"prodId\":\"").append(rows.get(i)[0]).append("\"")
                .append(",\"prodNm\":\"").append(escapeJson(String.valueOf(rows.get(i)[1]))).append("\"")
                .append(",\"qty\":").append(((Number) rows.get(i)[2]).longValue())
                .append(",\"amt\":").append(((Number) rows.get(i)[3]).longValue()).append("}");
        }
        json.append("]");

        CmDashboardItemData row = findOrNew(panel, yyyymmdd);
        row.setDataJson(json.toString());
        dataRepo.save(row);
        return 1;
    }

    /* ── 공통 헬퍼 ───────────────────────────────────────────────────────── */

    /**
     * 기존 행 조회 — 없으면 신규 Entity 생성.
     * unique key: (siteId, dashboardItemId, yyyymmdd).
     */
    private CmDashboardItemData findOrNew(CmDashboardItem panel, String yyyymmdd) {
        Optional<CmDashboardItemData> existing = dataRepo.findBySiteIdAndDashboardItemIdAndYyyymmdd(
            panel.getSiteId(), panel.getDashboardItemId(), yyyymmdd);

        if (existing.isPresent()) {
            return existing.get();
        }

        CmDashboardItemData row = new CmDashboardItemData();
        row.setItemDataId(CmUtil.generateId("cm_dashboard_item_data"));
        row.setSiteId(panel.getSiteId());
        row.setDashboardItemId(panel.getDashboardItemId());
        row.setUiNm(UI);
        row.setItemKey(panel.getItemKey());
        row.setYyyymmdd(yyyymmdd);
        return row;
    }

    /** rows[i] = [name, count] 형태의 목록을 col1~col9 에 저장 (최대 9행). */
    private void setColValues(CmDashboardItemData row, List<Object[]> rows,
                              String[] nmFields, String[] numFields) {
        for (int i = 0; i < Math.min(rows.size(), 9); i++) {
            String nm  = String.valueOf(rows.get(i)[0]);
            double num = ((Number) rows.get(i)[1]).doubleValue();
            try {
                CmDashboardItemData.class.getMethod("set" + capitalize(nmFields[i]), String.class)
                    .invoke(row, nm);
                CmDashboardItemData.class.getMethod("set" + capitalize(numFields[i]), Double.class)
                    .invoke(row, num);
            } catch (Exception ex) {
                log.warn("[{}] col 값 세팅 실패 idx={}: {}", batchCode(), i, ex.getMessage());
            }
        }
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
