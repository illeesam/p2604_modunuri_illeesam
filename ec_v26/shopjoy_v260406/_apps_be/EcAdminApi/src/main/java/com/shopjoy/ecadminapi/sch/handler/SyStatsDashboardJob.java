package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardDataRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmDashboardDataGridService;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 대시보드 자동수집 배치 — {@code cm_dashboard_item.auto_collect_yn='Y'} 인 항목의 값을
 * 실 EC 테이블을 집계해 채운다.
 * batch_code: STATS_DASHBOARD
 * cron: 5 0 * * * (매일 00:05 — STATS_AGGREGATION 이후)
 *
 * <p>2026-08-21 대시보드가 3레벨(차트/시리즈/항목) 구조로 재편되면서 이 배치는 한동안
 * no-op 이었다(옛 {@code COMP0101} 같은 고정 키가 새 {@code item_key}(chart### 전역 일련번호)
 * 와 더 이상 일치하지 않아서). 지금은 우선 <b>2개 위젯만</b> 다시 연결한다 — 나머지는
 * {@code auto_collect_yn='Y'} 로 표시하고 이 파일에 {@code upsertXxx()} 메서드 + {@link #execute}
 * 호출 한 줄을 추가하면 같은 패턴으로 확장된다.</p>
 * <ul>
 *   <li>{@code chart036} 월별 매출현황 — 이번 달 결제완료 매출 합계</li>
 *   <li>{@code chart041} 주문완료 현황 — 이번 달 주문완료 건수</li>
 * </ul>
 *
 * <p>둘 다 {@code axis_type_cd=DATE}, 단일 시리즈(series01)이고 항목(m01~m12)이 이미
 * 마이그레이션으로 만들어져 있어 새 정의행을 만들 필요 없이 <b>이번 달 항목(mNN)에 값만
 * upsert</b>한다. 매일 실행해 이번 달 누적치를 다시 계산해 덮어쓰므로 월중에도 최신값을
 * 유지한다. 좌표({@code data_opts})는 {@link CmDashboardDataGridService#buildOptions}
 * 를 그대로 재사용해 화면이 만드는 좌표와 반드시 같은 규칙을 따르게 한다 — 직접 문자열을
 * 조립하면 형식이 미묘하게 어긋나 upsert 가 매번 새 행을 만드는 사고로 이어지기 쉽다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyStatsDashboardJob implements SchBatchJobHandler {

    private static final String SCHEMA = "shopjoy_2604";

    private final CmDashboardItemRepository itemRepository;
    private final CmDashboardDataRepository dataRepository;

    @PersistenceContext
    private EntityManager em;

    @Override
    public String batchCode() { return "STATS_DASHBOARD"; }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDate today = LocalDate.now();
        String siteId = SecurityUtil.DEFAULT_SITE_ID;   /* 대표 사이트 1개만 집계 — 다중 사이트 확장은 이후 과제 */
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd   = today.atTime(23, 59, 59);
        String monthKey = String.format("m%02d", today.getMonthValue());
        /* 2026-08-26: yyyymmdd 컬럼은 dateTypeCd 에 맞는 실제 자리수만 담는다 — 월 데이터는
           6자리(YYYYMM), 예전처럼 뒤에 "00" 을 붙여 8자리로 0-패딩하지 않는다. */
        String yyyymm = String.format("%d%02d", today.getYear(), today.getMonthValue());

        log.info("[{}] 대시보드 자동수집 시작 — 대상월: {}", batchCode(), yyyymm);

        int saved = 0;
        try { saved += upsertMonthlySales(siteId, yyyymm, monthKey, monthStart, monthEnd); }
        catch (Exception e) { log.error("[{}] chart036 월별매출 실패: {}", batchCode(), e.getMessage(), e); }

        try { saved += upsertMonthlyOrderCount(siteId, yyyymm, monthKey, monthStart, monthEnd); }
        catch (Exception e) { log.error("[{}] chart041 주문완료현황 실패: {}", batchCode(), e.getMessage(), e); }

        log.info("[{}] 자동수집 완료 — {}건 upsert", batchCode(), saved);
    }

    /* ── chart036: 월별 매출현황 (이번 달 결제완료 매출 합계) ────────────────── */
    private int upsertMonthlySales(String siteId, String yyyymm, String monthKey,
                                   LocalDateTime start, LocalDateTime end) {
        Number sum = (Number) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertMonthlySales */
                       COALESCE(SUM(o.pay_amt), 0)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(SCHEMA))
            .setParameter("s", start).setParameter("e", end).getSingleResult();
        return upsertLeaf("chart036-series01-" + monthKey, siteId, yyyymm, sum.doubleValue());
    }

    /* ── chart041: 주문완료 현황 (이번 달 주문완료 건수) ─────────────────────── */
    private int upsertMonthlyOrderCount(String siteId, String yyyymm, String monthKey,
                                        LocalDateTime start, LocalDateTime end) {
        Number cnt = (Number) em.createNativeQuery("""
                SELECT /* sch :: StatsDashboardJob :: upsertMonthlyOrderCount */
                       COUNT(*)
                FROM %s.od_order o
                WHERE o.order_date BETWEEN :s AND :e
                  AND o.order_status_cd NOT IN ('PENDING','CANCEL')
                  AND o.simul_yn = 'N'
                """.formatted(SCHEMA))
            .setParameter("s", start).setParameter("e", end).getSingleResult();
        return upsertLeaf("chart041-series01-" + monthKey, siteId, yyyymm, cnt.doubleValue());
    }

    /**
     * item_key(항상 3레벨) + (사이트,월) 좌표로 upsert. 정의행이 없으면(아직 마이그레이션 안 된
     * 환경, 항목관리에서 지운 경우 등) 조용히 건너뛴다 — 배치 한 항목 실패로 나머지가 죽으면 안 된다.
     */
    private int upsertLeaf(String itemKey, String siteId, String yyyymm, Double val) {
        CmDashboardItem leaf = itemRepository.selectByItemKey(itemKey).orElse(null);
        if (leaf == null) { log.warn("[{}] 정의행 없음 — 건너뜀: {}", batchCode(), itemKey); return 0; }

        CmDashboardData probe = new CmDashboardData();
        probe.setSiteId(siteId);
        probe.setYyyymmdd(yyyymm);
        probe.setDateTypeCd("m");
        String dataOpts  = CmDashboardDataGridService.buildOptions(probe);
        String dataOpt2s = CmDashboardDataGridService.buildOptions2(probe);

        LocalDateTime now = LocalDateTime.now();
        CmDashboardData row = dataRepository.selectByCoordinate(itemKey, dataOpts, dataOpt2s)
            .orElseGet(() -> {
                CmDashboardData n = new CmDashboardData();
                n.setDashboardDataId(CmUtil.generateId("cm_dashboard_data"));
                n.setRegBy("BATCH"); n.setRegDate(now);
                return n;
            });
        /* item1Key/item2Key/item3Key 는 CmDashboardData.deriveItemLevelKeys()(@PrePersist/
           @PreUpdate)가 itemKey 로 저장 직전 자동 재계산한다 — 여기서 따로 계산해 넣지 않는다. */
        row.setDashboardItemId(leaf.getDashboardItemId());
        row.setDashboardId(leaf.getDashboardId());
        row.setItemKey(itemKey);
        row.setDataOpts(dataOpts);
        row.setDataOpt2s(dataOpt2s);
        row.setSiteId(siteId);
        row.setYyyymmdd(yyyymm);
        row.setDateTypeCd("m");
        row.setDataVal(val);
        row.setUpdBy("BATCH"); row.setUpdDate(now);
        dataRepository.save(row);
        return 1;
    }
}
