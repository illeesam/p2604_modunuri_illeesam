package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 대시보드 항목의 <b>실데이터 소스</b> 레지스트리.
 *
 * <p>{@code cm_dashboard_item.data_source_cd} 에 적힌 이름으로 여기 등록된 집계 쿼리를 찾아
 * 조회 시점에 실제 테이블을 집계한다. 이름이 없거나 등록되지 않았으면 호출부가
 * {@code cm_dashboard_item_data}(미리 넣어둔 행)로 폴백한다.</p>
 *
 * <h3>왜 SQL 을 DB 컬럼에 두지 않았나</h3>
 * <p>임의 SQL 을 값으로 두면 팝업·항목 관리 화면에서 편집 가능한 인젝션 경로가 된다.
 * DB 에는 <b>이름만</b> 두고 실제 쿼리는 코드에 둔다. 등록되지 않은 이름은 조용히 폴백하므로
 * 오타로 화면이 죽지 않는다.</p>
 *
 * <h3>반환 규약</h3>
 * <p>결과는 {@link CmDashboardItemData} 형태로 맞춘다 — 프론트(cmDashWidgetUtil)가
 * {@code col1Nm~col6Nm}(텍스트) / {@code col1Num~col9Num}(숫자) 만 보기 때문이다.
 * 저장하지 않는 <b>일회성 객체</b>라 dashboardItemDataId 는 채우지 않는다.</p>
 *
 * <ul>
 *   <li>KPI   — 마지막 행의 col1Num 이 값, col1Nm 이 라벨. 2행이면 앞 행 대비 증감이 표시된다</li>
 *   <li>CHART — col1Nm 이 X축 라벨, col1Num~ 이 시리즈 값</li>
 *   <li>TABLE — series_json 의 key 순서대로 컬럼이 된다</li>
 * </ul>
 */
@Slf4j
@Component
public class CmDashboardDataSourceRegistry {

    @PersistenceContext
    private EntityManager em;

    /** 목록형 소스가 한 번에 내려주는 최대 행 수 — 대시보드 카드는 스크롤이 짧아 더 받아도 못 본다 */
    private static final int LIST_LIMIT = 10;

    /**
     * 소스명 → 네이티브 SQL.
     *
     * <p>SELECT 별칭은 반드시 {@code col1_nm} / {@code col1_num} 형식이어야 한다(아래 매핑 규약).
     * 사이트 격리가 필요한 쿼리는 {@code :siteId} 를 쓴다 — 안 쓰는 쿼리에도 바인딩은 안전하게 건너뛴다.</p>
     *
     * <p><b>주의 — PostgreSQL 캐스트 {@code ::} 금지.</b> Hibernate 는 네이티브 SQL 에서
     * {@code :} 를 명명 파라미터 시작으로 읽는다. {@code join_date::date} 는 {@code :date}
     * 파라미터로 오인돼 "syntax error at or near :" 로 깨지고, 그 트랜잭션이 오염되어
     * 뒤이은 폴백 조회까지 500 으로 실패한다. {@code CAST(x AS date)} 로 쓴다.</p>
     *
     */
    private static final Map<String, String> SQL = new LinkedHashMap<>();
    static {

        /* ── 회원 ────────────────────────────────────────────── */
        SQL.put("MB_TOTAL",
            "SELECT '총 회원수' AS col1_nm, COUNT(m.*) AS col1_num "
          + "FROM shopjoy_2604.mb_member m");

        SQL.put("MB_NEW_TODAY",
            "SELECT '오늘 신규가입' AS col1_nm, COUNT(m.*) AS col1_num "
          + "FROM shopjoy_2604.mb_member m "
          + "WHERE m.join_date >= CURRENT_DATE");

        SQL.put("MB_GRADE_DIST",
            "SELECT COALESCE(g.grade_nm, m.grade_cd, '미지정') AS col1_nm, "
          + "       COUNT(m.*) AS col1_num, "
          + "       ROUND(AVG(COALESCE(m.total_purchase_amt, 0))) AS col2_num, "
          + "       SUM(COALESCE(m.order_count, 0)) AS col3_num "
          + "FROM shopjoy_2604.mb_member m "
          + "LEFT JOIN shopjoy_2604.mb_member_grade g ON g.grade_cd = m.grade_cd "
          + "GROUP BY COALESCE(g.grade_nm, m.grade_cd, '미지정') "
          + "ORDER BY COUNT(m.*) DESC");

        SQL.put("MB_RECENT",
            "SELECT m.member_nm AS col1_nm, COALESCE(m.grade_cd, '-') AS col2_nm, "
          + "       TO_CHAR(m.join_date, 'MM-DD') AS col3_nm, "
          + "       COALESCE(m.order_count, 0) AS col1_num, "
          + "       COALESCE(m.total_purchase_amt, 0) AS col2_num "
          + "FROM shopjoy_2604.mb_member m "
          + "WHERE m.join_date IS NOT NULL "
          + "ORDER BY m.join_date DESC LIMIT " + LIST_LIMIT);

        /* ── 상품 ────────────────────────────────────────────── */
        SQL.put("PD_TOTAL",
            "SELECT '판매중 상품' AS col1_nm, COUNT(p.*) AS col1_num "
          + "FROM shopjoy_2604.pd_prod p "
          + "WHERE COALESCE(p.sold_out_yn, 'N') <> 'Y'");

        SQL.put("PD_SOLDOUT",
            "SELECT '품절 상품' AS col1_nm, COUNT(p.*) AS col1_num "
          + "FROM shopjoy_2604.pd_prod p "
          + "WHERE p.sold_out_yn = 'Y'");

        SQL.put("PD_RECENT",
            "SELECT COALESCE(p.prod_code, '-') AS col1_nm, p.prod_nm AS col2_nm, "
          + "       COALESCE(p.prod_status_cd, '-') AS col3_nm, "
          + "       TO_CHAR(p.reg_date, 'MM-DD') AS col4_nm, "
          + "       COALESCE(p.sale_price, 0) AS col1_num, "
          + "       COALESCE(p.view_count, 0) AS col2_num "
          + "FROM shopjoy_2604.pd_prod p "
          + "ORDER BY p.reg_date DESC LIMIT " + LIST_LIMIT);

        SQL.put("PD_TOPVIEW",
            "SELECT p.prod_nm AS col1_nm, COALESCE(p.prod_status_cd, '-') AS col2_nm, "
          + "       COALESCE(p.view_count, 0) AS col1_num, "
          + "       COALESCE(p.sale_price, 0) AS col2_num "
          + "FROM shopjoy_2604.pd_prod p "
          + "ORDER BY COALESCE(p.view_count, 0) DESC LIMIT " + LIST_LIMIT);

        /* ── 주문 ────────────────────────────────────────────── */
        SQL.put("OD_TODAY_CNT",
            "SELECT '오늘 주문' AS col1_nm, COUNT(o.*) AS col1_num "
          + "FROM shopjoy_2604.od_order o "
          + "WHERE o.order_date >= CURRENT_DATE");

        SQL.put("OD_TODAY_AMT",
            "SELECT '오늘 매출' AS col1_nm, COALESCE(SUM(o.pay_amt), 0) AS col1_num "
          + "FROM shopjoy_2604.od_order o "
          + "WHERE o.order_date >= CURRENT_DATE");

        SQL.put("OD_TREND_7D",
            "SELECT TO_CHAR(o.order_date, 'MM-DD') AS col1_nm, "
          + "       COALESCE(SUM(o.pay_amt), 0) AS col1_num, COUNT(o.*) AS col2_num "
          + "FROM shopjoy_2604.od_order o "
          + "WHERE o.order_date >= CURRENT_DATE - INTERVAL '6 day' "
          + "GROUP BY TO_CHAR(o.order_date, 'MM-DD') ORDER BY 1");

        SQL.put("OD_RECENT",
            "SELECT o.order_id AS col1_nm, COALESCE(o.member_nm, '-') AS col2_nm, "
          + "       COALESCE(o.order_status_cd, '-') AS col3_nm, "
          + "       COALESCE(o.pay_amt, 0) AS col1_num "
          + "FROM shopjoy_2604.od_order o "
          + "ORDER BY o.order_date DESC LIMIT " + LIST_LIMIT);

        SQL.put("OD_PAY_DIST",
            "SELECT COALESCE(o.pay_method_cd, '미지정') AS col1_nm, "
          + "       COUNT(o.*) AS col1_num, COALESCE(SUM(o.pay_amt), 0) AS col2_num, "
          + "       ROUND(AVG(COALESCE(o.pay_amt, 0))) AS col3_num "
          + "FROM shopjoy_2604.od_order o "
          + "GROUP BY COALESCE(o.pay_method_cd, '미지정') ORDER BY COUNT(o.*) DESC");

        SQL.put("OD_STATUS_DIST",
            "SELECT COALESCE(o.order_status_cd, '미지정') AS col1_nm, COUNT(o.*) AS col1_num "
          + "FROM shopjoy_2604.od_order o "
          + "GROUP BY COALESCE(o.order_status_cd, '미지정') ORDER BY COUNT(o.*) DESC");

        /* ── 고객센터 ────────────────────────────────────────── */
        SQL.put("CS_FAQ_TOP",
            "SELECT f.faq_question AS col1_nm, COALESCE(f.use_yn, 'Y') AS col2_nm, "
          + "       COALESCE(f.view_count, 0) AS col1_num "
          + "FROM shopjoy_2604.cm_faq f "
          + "ORDER BY COALESCE(f.view_count, 0) DESC LIMIT " + LIST_LIMIT);

        /* ── 프로모션 ────────────────────────────────────────── */
        SQL.put("PM_EVENT_ACTIVE",
            "SELECT '진행중 이벤트' AS col1_nm, COUNT(e.*) AS col1_num "
          + "FROM shopjoy_2604.pm_event e "
          + "WHERE COALESCE(e.use_yn, 'Y') = 'Y' "
          + "  AND (e.start_date IS NULL OR e.start_date <= CURRENT_DATE) "
          + "  AND (e.end_date   IS NULL OR e.end_date   >= CURRENT_DATE)");

        SQL.put("PM_EVENT_LIST",
            "SELECT e.event_nm AS col1_nm, COALESCE(e.event_status_cd, '-') AS col2_nm, "
          + "       TO_CHAR(e.start_date, 'MM-DD') || '~' || TO_CHAR(e.end_date, 'MM-DD') AS col3_nm, "
          + "       COALESCE(e.view_cnt, 0) AS col1_num "
          + "FROM shopjoy_2604.pm_event e "
          + "ORDER BY e.start_date DESC NULLS LAST LIMIT " + LIST_LIMIT);

        SQL.put("PM_COUPON_DIST",
            "SELECT c.coupon_nm AS col1_nm, "
          + "       COALESCE(c.issue_cnt, 0) AS col1_num, "
          + "       COUNT(i.coupon_issue_id) FILTER (WHERE i.use_yn = 'Y') AS col2_num, "
          + "       COUNT(i.coupon_issue_id) AS col3_num "
          + "FROM shopjoy_2604.pm_coupon c "
          + "LEFT JOIN shopjoy_2604.pm_coupon_issue i ON i.coupon_id = c.coupon_id "
          + "GROUP BY c.coupon_id, c.coupon_nm, c.issue_cnt "
          + "ORDER BY COUNT(i.coupon_issue_id) DESC LIMIT " + LIST_LIMIT);

        SQL.put("PM_CACHE_RECENT",
            "SELECT COALESCE(h.member_nm, '-') AS col1_nm, COALESCE(h.cache_type_cd, '-') AS col2_nm, "
          + "       TO_CHAR(h.cache_date, 'MM-DD') AS col3_nm, "
          + "       COALESCE(h.cache_amt, 0) AS col1_num, COALESCE(h.balance_amt, 0) AS col2_num "
          + "FROM shopjoy_2604.pm_cache h "
          + "ORDER BY h.cache_date DESC NULLS LAST LIMIT " + LIST_LIMIT);

        /* ── 전시 ────────────────────────────────────────────── */
        SQL.put("DP_UI_CNT",
            "SELECT '전시 UI' AS col1_nm, COUNT(u.*) AS col1_num "
          + "FROM shopjoy_2604.dp_ui u");

        SQL.put("DP_AREA_CNT",
            "SELECT '전시 영역' AS col1_nm, COUNT(a.*) AS col1_num "
          + "FROM shopjoy_2604.dp_area a");

        SQL.put("DP_PANEL_CNT",
            "SELECT '전시 패널' AS col1_nm, COUNT(p.*) AS col1_num "
          + "FROM shopjoy_2604.dp_panel p");

        SQL.put("DP_WIDGET_CNT",
            "SELECT '위젯 인스턴스' AS col1_nm, COUNT(w.*) AS col1_num "
          + "FROM shopjoy_2604.dp_widget w");

        SQL.put("DP_WIDGET_TYPE",
            "SELECT COALESCE(w.widget_type_cd, '미지정') AS col1_nm, COUNT(w.*) AS col1_num "
          + "FROM shopjoy_2604.dp_widget w "
          + "GROUP BY COALESCE(w.widget_type_cd, '미지정') ORDER BY COUNT(w.*) DESC");

        SQL.put("DP_UI_LIST",
            "SELECT u.ui_nm AS col1_nm, COALESCE(u.use_yn, 'Y') AS col2_nm, "
          + "       COUNT(DISTINCT a.area_id) AS col1_num, COUNT(DISTINCT p.panel_id) AS col2_num "
          + "FROM shopjoy_2604.dp_ui u "
          + "LEFT JOIN shopjoy_2604.dp_area  a ON a.ui_id = u.ui_id "
          + "LEFT JOIN shopjoy_2604.dp_panel p ON p.area_id = a.area_id "
          + "GROUP BY u.ui_id, u.ui_nm, u.use_yn, u.sort_ord ORDER BY u.sort_ord");

        /* ── 정산 ────────────────────────────────────────────── */
        /* "이번달" 이 아니라 "최근 마감월" 기준 — 정산은 월 마감이라 당월은 아직 안 닫혀 있는 게 정상이다.
           당월로 고정하면 매달 초에 KPI 가 0 으로 보여 지표 구실을 못 한다. 라벨에 마감월을 넣는다. */
        SQL.put("ST_MONTH_AMT",
            "SELECT '정산액 (' || MAX(t.settle_ym) || ')' AS col1_nm, "
          + "       COALESCE(SUM(t.final_settle_amt) FILTER "
          + "         (WHERE t.settle_ym = (SELECT MAX(x.settle_ym) FROM shopjoy_2604.st_settle x)), 0) AS col1_num "
          + "FROM shopjoy_2604.st_settle t");

        SQL.put("ST_VENDOR_LIST",
            "SELECT COALESCE(v.vendor_nm, t.vendor_id) AS col1_nm, "
          + "       COALESCE(t.settle_status_cd, '-') AS col2_nm, t.settle_ym AS col3_nm, "
          + "       COALESCE(t.final_settle_amt, 0) AS col1_num, "
          + "       COALESCE(t.commission_amt, 0) AS col2_num "
          + "FROM shopjoy_2604.st_settle t "
          + "LEFT JOIN shopjoy_2604.sy_vendor v ON v.vendor_id = t.vendor_id "
          + "ORDER BY t.settle_ym DESC, COALESCE(t.final_settle_amt, 0) DESC LIMIT " + LIST_LIMIT);

        SQL.put("ST_YM_TREND",
            "SELECT t.settle_ym AS col1_nm, "
          + "       COALESCE(SUM(t.final_settle_amt), 0) AS col1_num, "
          + "       COALESCE(SUM(t.commission_amt), 0) AS col2_num "
          + "FROM shopjoy_2604.st_settle t "
          + "GROUP BY t.settle_ym ORDER BY t.settle_ym");

        /* ── 회원 (추가) ─────────────────────────────────────── */
        SQL.put("MB_DORMANT",
            "SELECT '휴면 회원' AS col1_nm, COUNT(m.*) AS col1_num "
          + "FROM shopjoy_2604.mb_member m "
          + "WHERE m.member_status_cd = 'DORMANT'");

        SQL.put("MB_WITHDRAWN",
            "SELECT '탈퇴/정지 회원' AS col1_nm, COUNT(m.*) AS col1_num "
          + "FROM shopjoy_2604.mb_member m "
          + "WHERE m.member_status_cd IN ('WITHDRAWN', 'SUSPENDED')");

        SQL.put("MB_JOIN_TREND_7D",
            "SELECT TO_CHAR(d.day, 'MM-DD') AS col1_nm, COUNT(m.member_id) AS col1_num "
          + "FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day') d(day) "
          + "LEFT JOIN shopjoy_2604.mb_member m ON CAST(m.join_date AS date) = d.day "
          + "GROUP BY d.day ORDER BY d.day");

        SQL.put("MB_DORMANT_LIST",
            "SELECT m.member_nm AS col1_nm, COALESCE(m.member_status_cd, '-') AS col2_nm, "
          + "       TO_CHAR(m.last_login, 'YYYY-MM-DD') AS col3_nm, "
          + "       COALESCE(m.order_count, 0) AS col1_num, "
          + "       COALESCE(m.cache_balance_amt, 0) AS col2_num "
          + "FROM shopjoy_2604.mb_member m "
          + "WHERE m.member_status_cd <> 'ACTIVE' "
          + "ORDER BY m.last_login ASC NULLS FIRST LIMIT " + LIST_LIMIT);

        /* ── 상품 (추가) ─────────────────────────────────────── */
        SQL.put("PD_NEW_WEEK",
            "SELECT '이번주 신규' AS col1_nm, COUNT(p.*) AS col1_num "
          + "FROM shopjoy_2604.pd_prod p "
          + "WHERE p.reg_date >= CURRENT_DATE - 6");

        SQL.put("PD_QNA_WAIT",
            "SELECT '미답변 문의' AS col1_nm, COUNT(q.*) AS col1_num "
          + "FROM shopjoy_2604.pd_prod_qna q "
          + "WHERE COALESCE(q.answ_yn, 'N') <> 'Y'");

        SQL.put("PD_CATE_DIST",
            "SELECT c.category_nm AS col1_nm, COUNT(cp.prod_id) AS col1_num "
          + "FROM shopjoy_2604.pd_category c "
          + "LEFT JOIN shopjoy_2604.pd_category_prod cp ON cp.category_id = c.category_id "
          + "WHERE c.category_depth = 1 "
          + "GROUP BY c.category_id, c.category_nm, c.sort_ord ORDER BY c.sort_ord LIMIT 12");

        SQL.put("PD_LOWSTOCK",
            "SELECT p.prod_nm AS col1_nm, COALESCE(k.stock_code, '-') AS col2_nm, "
          + "       COALESCE(k.stock_qty, 0) AS col1_num, COALESCE(p.sale_price, 0) AS col2_num "
          + "FROM shopjoy_2604.pd_prod_stock k "
          + "JOIN shopjoy_2604.pd_prod p ON p.prod_id = k.prod_id "
          + "WHERE COALESCE(k.stock_qty, 0) < 10 "
          + "ORDER BY COALESCE(k.stock_qty, 0) ASC LIMIT " + LIST_LIMIT);

        /* ── 주문 (추가) ─────────────────────────────────────── */
        SQL.put("OD_WAIT_CNT",
            "SELECT '미처리 주문' AS col1_nm, COUNT(o.*) AS col1_num "
          + "FROM shopjoy_2604.od_order o "
          + "WHERE o.order_status_cd IN ('PENDING', 'WAIT_PAY', 'PAID', 'PREPARING')");

        SQL.put("OD_CLAIM_OPEN",
            "SELECT '진행중 클레임' AS col1_nm, COUNT(cl.*) AS col1_num "
          + "FROM shopjoy_2604.od_claim cl "
          + "WHERE cl.claim_status_cd NOT IN ('COMPLT', 'COMPLETE', 'DONE', 'CANCEL')");

        SQL.put("OD_UNPROC_LIST",
            "SELECT o.order_id AS col1_nm, COALESCE(o.order_status_cd, '-') AS col2_nm, "
          + "       TO_CHAR(o.order_date, 'MM-DD HH24:MI') AS col3_nm, "
          + "       COALESCE(o.pay_amt, 0) AS col1_num, "
          + "       ROUND(EXTRACT(EPOCH FROM (now() - o.order_date)) / 3600) AS col2_num "
          + "FROM shopjoy_2604.od_order o "
          + "WHERE o.order_status_cd IN ('PENDING', 'WAIT_PAY', 'PAID', 'PREPARING') "
          + "ORDER BY o.order_date ASC LIMIT " + LIST_LIMIT);

        /* ── 프로모션 (추가) ─────────────────────────────────── */
        SQL.put("PM_ISSUE_MONTH",
            "SELECT '이번달 쿠폰발급' AS col1_nm, COUNT(i.*) AS col1_num "
          + "FROM shopjoy_2604.pm_coupon_issue i "
          + "WHERE i.issue_date >= date_trunc('month', CURRENT_DATE)");

        SQL.put("PM_USE_MONTH",
            "SELECT '이번달 쿠폰사용' AS col1_nm, COUNT(i.*) AS col1_num "
          + "FROM shopjoy_2604.pm_coupon_issue i "
          + "WHERE i.use_yn = 'Y' "
          + "  AND i.use_date >= date_trunc('month', CURRENT_DATE)");

        SQL.put("PM_CACHE_MONTH",
            "SELECT '이번달 캐시지급' AS col1_nm, COALESCE(SUM(h.cache_amt), 0) AS col1_num "
          + "FROM shopjoy_2604.pm_cache h "
          + "WHERE COALESCE(h.cache_amt, 0) > 0 "
          + "  AND h.cache_date >= date_trunc('month', CURRENT_DATE)");

        SQL.put("PM_ISSUE_TREND",
            "SELECT TO_CHAR(d.day, 'MM-DD') AS col1_nm, "
          + "       COUNT(i.coupon_issue_id) AS col1_num, COUNT(u.coupon_issue_id) AS col2_num "
          + "FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day') d(day) "
          + "LEFT JOIN shopjoy_2604.pm_coupon_issue i ON CAST(i.issue_date AS date) = d.day "
          + "LEFT JOIN shopjoy_2604.pm_coupon_issue u "
          + "       ON u.use_yn = 'Y' AND CAST(u.use_date AS date) = d.day "
          + "GROUP BY d.day ORDER BY d.day");

        /* ── 전시 (추가) ─────────────────────────────────────── */
        SQL.put("DP_PANEL_WIDGET",
            "SELECT p.panel_nm AS col1_nm, COALESCE(a.area_nm, '-') AS col2_nm, "
          + "       COALESCE(p.disp_panel_status_cd, '-') AS col3_nm, "
          + "       COUNT(pi.panel_item_id) AS col1_num "
          + "FROM shopjoy_2604.dp_panel p "
          + "LEFT JOIN shopjoy_2604.dp_area a ON a.area_id = p.area_id "
          + "LEFT JOIN shopjoy_2604.dp_panel_item pi ON pi.panel_id = p.panel_id "
          + "GROUP BY p.panel_id, p.panel_nm, a.area_nm, p.disp_panel_status_cd "
          + "ORDER BY COUNT(pi.panel_item_id) DESC LIMIT " + LIST_LIMIT);

        SQL.put("DP_RECENT_CHG",
            "SELECT w.widget_nm AS col1_nm, COALESCE(w.widget_type_cd, '-') AS col2_nm, "
          + "       COALESCE(w.upd_by, w.reg_by, '-') AS col3_nm, "
          + "       TO_CHAR(COALESCE(w.upd_date, w.reg_date), 'MM-DD HH24:MI') AS col4_nm "
          + "FROM shopjoy_2604.dp_widget w "
          + "ORDER BY COALESCE(w.upd_date, w.reg_date) DESC NULLS LAST LIMIT " + LIST_LIMIT);

        /* ── 고객센터 (추가) ─────────────────────────────────── */
        SQL.put("CS_WAIT_CNT",
            "SELECT '미답변 문의' AS col1_nm, COUNT(q.*) AS col1_num "
          + "FROM shopjoy_2604.sy_contact q "
          + "WHERE q.answer_date IS NULL");

        SQL.put("CS_TODAY_CNT",
            "SELECT '오늘 접수' AS col1_nm, COUNT(q.*) AS col1_num "
          + "FROM shopjoy_2604.sy_contact q "
          + "WHERE q.contact_date >= CURRENT_DATE");

        SQL.put("CS_CHAT_OPEN",
            "SELECT '진행중 상담' AS col1_nm, COUNT(t.*) AS col1_num "
          + "FROM shopjoy_2604.cm_chatt t "
          + "WHERE t.chatt_status_cd NOT IN ('CLOSED', 'DONE')");

        SQL.put("CS_AVG_HOUR",
            "SELECT '평균 응답(시간)' AS col1_nm, "
          + "       COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (q.answer_date - q.contact_date)) / 3600)), 0) AS col1_num "
          + "FROM shopjoy_2604.sy_contact q "
          + "WHERE q.answer_date IS NOT NULL AND q.contact_date IS NOT NULL");

        SQL.put("CS_CATEGORY_DIST",
            "SELECT COALESCE(q.category_cd, '미분류') AS col1_nm, COUNT(q.*) AS col1_num "
          + "FROM shopjoy_2604.sy_contact q "
          + "GROUP BY COALESCE(q.category_cd, '미분류') ORDER BY COUNT(q.*) DESC");

        SQL.put("CS_RECENT_LIST",
            "SELECT q.contact_id AS col1_nm, COALESCE(q.category_cd, '-') AS col2_nm, "
          + "       q.contact_title AS col3_nm, COALESCE(q.contact_status_cd, '-') AS col4_nm, "
          + "       TO_CHAR(q.contact_date, 'MM-DD') AS col5_nm "
          + "FROM shopjoy_2604.sy_contact q "
          + "ORDER BY q.contact_date DESC NULLS LAST LIMIT " + LIST_LIMIT);

        SQL.put("CS_UNANSWERED_LIST",
            "SELECT q.contact_id AS col1_nm, COALESCE(q.category_cd, '-') AS col2_nm, "
          + "       q.contact_title AS col3_nm, "
          + "       ROUND(EXTRACT(EPOCH FROM (now() - q.contact_date)) / 3600) AS col1_num "
          + "FROM shopjoy_2604.sy_contact q "
          + "WHERE q.answer_date IS NULL "
          + "ORDER BY q.contact_date ASC NULLS LAST LIMIT " + LIST_LIMIT);

        /* ── 정산 (추가) ─────────────────────────────────────── */
        SQL.put("ST_UNPAID_AMT",
            "SELECT '미지급 금액' AS col1_nm, COALESCE(SUM(t.final_settle_amt), 0) AS col1_num "
          + "FROM shopjoy_2604.st_settle t "
          + "WHERE t.settle_status_cd <> 'PAID'");

        SQL.put("ST_FEE_TOTAL",
            "SELECT '수수료 수익' AS col1_nm, COALESCE(SUM(t.commission_amt), 0) AS col1_num "
          + "FROM shopjoy_2604.st_settle t");

        SQL.put("ST_ADJ_CNT",
            "SELECT '정산 조정' AS col1_nm, COUNT(j.*) AS col1_num "
          + "FROM shopjoy_2604.st_settle_adj j");

        SQL.put("ST_UNPAID_LIST",
            "SELECT COALESCE(v.vendor_nm, t.vendor_id) AS col1_nm, t.settle_ym AS col2_nm, "
          + "       COALESCE(t.settle_status_cd, '-') AS col3_nm, "
          + "       COALESCE(t.final_settle_amt, 0) AS col1_num "
          + "FROM shopjoy_2604.st_settle t "
          + "LEFT JOIN shopjoy_2604.sy_vendor v ON v.vendor_id = t.vendor_id "
          + "WHERE t.settle_status_cd <> 'PAID' "
          + "ORDER BY t.settle_ym DESC LIMIT " + LIST_LIMIT);

        SQL.put("ST_ADJ_LIST",
            "SELECT COALESCE(v.vendor_nm, t.vendor_id) AS col1_nm, "
          + "       COALESCE(j.adj_type_cd, '-') AS col2_nm, "
          + "       COALESCE(j.adj_reason, '-') AS col3_nm, t.settle_ym AS col4_nm, "
          + "       COALESCE(j.adj_amt, 0) AS col1_num "
          + "FROM shopjoy_2604.st_settle_adj j "
          + "JOIN shopjoy_2604.st_settle t ON t.settle_id = j.settle_id "
          + "LEFT JOIN shopjoy_2604.sy_vendor v ON v.vendor_id = t.vendor_id "
          + "ORDER BY j.reg_date DESC NULLS LAST LIMIT " + LIST_LIMIT);

        /* ── 시스템 (추가) ───────────────────────────────────── */
        SQL.put("SY_ROLE_CNT",
            "SELECT '역할' AS col1_nm, COUNT(r.*) AS col1_num "
          + "FROM shopjoy_2604.sy_role r");

        SQL.put("SY_BATCH_FAIL",
            "SELECT '배치 실패' AS col1_nm, COUNT(b.*) AS col1_num "
          + "FROM shopjoy_2604.sy_batch b "
          + "WHERE b.batch_run_status_cd IN ('FAIL', 'ERROR', '실패')");

        /* 에러/접속 로그는 site_id 가 NULL 인 행이 정상적으로 존재한다(미인증 요청).
           사이트로 좁히면 대부분 빠지므로 전체를 센다. */
        SQL.put("SY_ERR_TODAY",
            "SELECT '오늘 오류' AS col1_nm, COUNT(e.*) AS col1_num "
          + "FROM shopjoy_2604.syh_access_error_log e "
          + "WHERE e.log_dt >= CURRENT_DATE");

        SQL.put("SY_API_TREND",
            "SELECT TO_CHAR(d.day, 'MM-DD') AS col1_nm, COUNT(l.log_id) AS col1_num "
          + "FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day') d(day) "
          + "LEFT JOIN shopjoy_2604.syh_access_log l ON CAST(l.req_dt AS date) = d.day "
          + "GROUP BY d.day ORDER BY d.day");

        SQL.put("SY_ERR_RECENT",
            "SELECT TO_CHAR(e.log_dt, 'MM-DD HH24:MI') AS col1_nm, "
          + "       COALESCE(e.req_path, '-') AS col2_nm, "
          + "       COALESCE(e.error_type, '-') AS col3_nm, "
          + "       COALESCE(e.user_id, '-') AS col4_nm "
          + "FROM shopjoy_2604.syh_access_error_log e "
          + "ORDER BY e.log_dt DESC NULLS LAST LIMIT " + LIST_LIMIT);

        /* ── 시스템 ──────────────────────────────────────────── */
        SQL.put("SY_USER_TOTAL",
            "SELECT '관리자 계정' AS col1_nm, COUNT(u.*) AS col1_num "
          + "FROM shopjoy_2604.sy_user u");

        SQL.put("SY_LOGIN_RECENT",
            "SELECT u.login_id AS col1_nm, u.user_nm AS col2_nm, "
          + "       COALESCE(u.user_status_cd, '-') AS col3_nm, "
          + "       TO_CHAR(u.last_login_date, 'MM-DD HH24:MI') AS col4_nm "
          + "FROM shopjoy_2604.sy_user u "
          + "WHERE u.last_login_date IS NOT NULL "
          + "ORDER BY u.last_login_date DESC LIMIT " + LIST_LIMIT);

        SQL.put("SY_BATCH_LIST",
            "SELECT b.batch_nm AS col1_nm, COALESCE(b.batch_cycle_cd, '-') AS col2_nm, "
          + "       COALESCE(b.batch_run_status_cd, '-') AS col3_nm, "
          + "       TO_CHAR(b.batch_last_run, 'MM-DD HH24:MI') AS col4_nm, "
          + "       COALESCE(b.batch_run_count, 0) AS col1_num "
          + "FROM shopjoy_2604.sy_batch b "
          + "ORDER BY b.batch_last_run DESC NULLS LAST LIMIT " + LIST_LIMIT);
    }

    /** 등록된 소스인가 */
    public boolean has(String sourceCd) {
        return sourceCd != null && !sourceCd.isBlank() && SQL.containsKey(sourceCd.trim());
    }

    /** 등록된 소스명 전체 (항목관리 화면 select 용) */
    public List<String> names() {
        return new ArrayList<>(SQL.keySet());
    }

    /**
     * 소스 실행 — 실패하면 빈 목록을 돌려주고 호출부가 저장 데이터로 폴백한다.
     *
     * <p>대시보드 한 칸이 깨졌다고 화면 전체가 죽으면 안 되므로 여기서 삼킨다.
     * 대신 어떤 소스가 실패했는지는 로그로 남긴다.</p>
     */
    @SuppressWarnings("unchecked")
    public List<CmDashboardItemData> run(String sourceCd, String siteId) {
        String sql = SQL.get(sourceCd == null ? "" : sourceCd.trim());
        if (sql == null) return List.of();
        try {
            Query q = em.createNativeQuery(sql, jakarta.persistence.Tuple.class);
            if (sql.contains(":siteId")) q.setParameter("siteId", siteId);
            List<jakarta.persistence.Tuple> rows = q.getResultList();
            List<CmDashboardItemData> out = new ArrayList<>();
            for (jakarta.persistence.Tuple t : rows) out.add(toData(t));
            return out;
        } catch (Exception e) {
            log.warn("[대시보드 데이터소스 실패] {} — {}", sourceCd, e.getMessage());
            return List.of();
        }
    }

    /** Tuple(col1_nm, col1_num …) → CmDashboardItemData (저장하지 않는 일회성 객체) */
    private CmDashboardItemData toData(jakarta.persistence.Tuple t) {
        CmDashboardItemData d = new CmDashboardItemData();
        for (var el : t.getElements()) {
            String alias = el.getAlias() == null ? "" : el.getAlias().toLowerCase();
            Object v = t.get(el.getAlias());
            if (v == null) continue;
            if (alias.matches("col[1-6]_nm"))  setNm(d, alias.charAt(3) - '0', String.valueOf(v));
            if (alias.matches("col[1-9]_num")) setNum(d, alias.charAt(3) - '0', toNum(v));
        }
        return d;
    }

    /** col*_num 은 엔티티에서 Double 이다 (금액·비율을 함께 담으려고) */
    private Double toNum(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.valueOf(String.valueOf(v).trim()); } catch (NumberFormatException e) { return null; }
    }

    private void setNm(CmDashboardItemData d, int k, String v) {
        switch (k) {
            case 1 -> d.setCol1Nm(v); case 2 -> d.setCol2Nm(v); case 3 -> d.setCol3Nm(v);
            case 4 -> d.setCol4Nm(v); case 5 -> d.setCol5Nm(v); case 6 -> d.setCol6Nm(v);
            default -> { }
        }
    }

    private void setNum(CmDashboardItemData d, int k, Double v) {
        switch (k) {
            case 1 -> d.setCol1Num(v); case 2 -> d.setCol2Num(v); case 3 -> d.setCol3Num(v);
            case 4 -> d.setCol4Num(v); case 5 -> d.setCol5Num(v); case 6 -> d.setCol6Num(v);
            case 7 -> d.setCol7Num(v); case 8 -> d.setCol8Num(v); case 9 -> d.setCol9Num(v);
            default -> { }
        }
    }
}
