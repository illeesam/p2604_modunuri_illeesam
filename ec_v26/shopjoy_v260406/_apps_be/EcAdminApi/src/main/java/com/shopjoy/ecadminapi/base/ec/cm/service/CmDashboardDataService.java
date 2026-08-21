package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmDashboardWidgetRow;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardDataRepository;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 대시보드 위젯이 화면에 그릴 값을 조회하는 서비스.
 *
 * <p>{@code dashboardItemId} 로 들어오는 값은 항상 <b>차트(1레벨)</b> ID 다(레이아웃 카드의
 * 식별자가 곧 차트 ID). 값 자체는 3레벨(항목)에만 붙으므로, 여기서
 * {@link CmDashboardDataGridService#queryWidgetRows} 로 시리즈×항목을 pivot 해 받아온다 —
 * 실데이터 소스({@code data_source_cd})가 걸린 항목은 그 결과를 우선한다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardDataService {

    private final CmDashboardDataRepository cmDashboardDataRepository;
    private final CmDashboardItemRepository cmDashboardItemRepository;
    private final CmDashboardDataSourceRegistry cmDashboardDataSourceRegistry;
    private final CmDashboardDataGridService cmDashboardDataGridService;

    @PersistenceContext
    private EntityManager em;

    public List<CmDashboardWidgetRow> getList(Map<String, Object> p) {
        String siteId = (String) p.get("siteId");
        String dashboardItemId = (String) p.get("dashboardItemId");   /* 차트(1레벨) ID */
        String startYmd = (String) p.get("startYmd");
        String endYmd   = (String) p.get("endYmd");

        /* 항목에 실데이터 소스가 걸려 있으면 조회 시점에 실제 테이블을 집계한다.
           소스가 없거나 실행에 실패하면(빈 결과) 아래 저장 데이터로 폴백한다 —
           대시보드 한 칸 때문에 화면 전체가 비지 않게 하는 것이 목적. */
        if (dashboardItemId != null) {
            List<CmDashboardWidgetRow> live = runDataSource(dashboardItemId, siteId);
            if (!live.isEmpty()) return live;
        }

        if (dashboardItemId == null) return List.of();
        return cmDashboardDataGridService.queryWidgetRows(dashboardItemId, siteId, startYmd, endYmd);
    }

    /** 항목의 data_source_cd 로 실데이터를 만든다. 소스 미지정/미등록/실패면 빈 목록 */
    private List<CmDashboardWidgetRow> runDataSource(String dashboardItemId, String siteId) {
        CmDashboardItem item = cmDashboardItemRepository.findById(dashboardItemId).orElse(null);
        if (item == null || !cmDashboardDataSourceRegistry.has(item.getDataSourceCd())) return List.of();
        return cmDashboardDataSourceRegistry.run(item.getDataSourceCd(), siteId);
    }

    /** 값 1행 직접 upsert — 데이터관리 화면 밖에서 단건으로 값을 넣을 때 쓴다 */
    @Transactional
    public CmDashboardData upsert(CmDashboardData body) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        if (body.getDashboardDataId() != null && !body.getDashboardDataId().isBlank()) {
            Optional<CmDashboardData> existing = cmDashboardDataRepository.findById(body.getDashboardDataId());
            if (existing.isPresent()) {
                CmDashboardData entity = existing.get();
                copyFields(body, entity);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmDashboardData saved = cmDashboardDataRepository.save(entity);
                em.flush();
                return saved;
            }
        }

        if (body.getItemKey() != null && body.getDataOpts() != null) {
            Optional<CmDashboardData> existing = cmDashboardDataRepository
                .findByItemKeyAndDataOpts(body.getItemKey(), body.getDataOpts());
            if (existing.isPresent()) {
                CmDashboardData entity = existing.get();
                copyFields(body, entity);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmDashboardData saved = cmDashboardDataRepository.save(entity);
                em.flush();
                return saved;
            }
        }

        body.setDashboardDataId(CmUtil.generateId("cm_dashboard_data"));
        body.setRegBy(authId); body.setRegDate(now);
        body.setUpdBy(authId); body.setUpdDate(now);
        CmDashboardData saved = cmDashboardDataRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void deleteByItemAndDate(String dashboardItemId, String yyyymmdd) {
        cmDashboardDataRepository.deleteByDashboardItemIdAndYyyymmdd(dashboardItemId, yyyymmdd);
        em.flush();
    }

    private void copyFields(CmDashboardData src, CmDashboardData dst) {
        if (src.getDeptId() != null)   dst.setDeptId(src.getDeptId());
        if (src.getUserId() != null)   dst.setUserId(src.getUserId());
        if (src.getDataVal() != null) dst.setDataVal(src.getDataVal());
    }
}
