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
        // [쿼리 메서드] 대시보드 차트 패널 정의 단건 조회
        CmDashboardItem item = cmDashboardItemRepository.findById(dashboardItemId).orElse(null);
        if (item == null || !cmDashboardDataSourceRegistry.has(item.getDataSourceCd())) return List.of();
        return cmDashboardDataSourceRegistry.run(item.getDataSourceCd(), siteId);
    }

    /**
     * 값 1행 직접 upsert — 데이터관리 화면 밖에서 단건으로 값을 넣을 때 쓴다.
     *
     * <p>기존 행이면 QueryDSL {@code updateSelective} 로 넘어온 필드(dept_id/user_id/data_val)만
     * SET 한다(예전엔 fetch 해서 필드 몇 개만 수동 복사(copyFields) 후 전체 save() 했는데,
     * 표준 3종 메서드(selectList/selectPageData/updateSelective) 로 통일하며 정리했다, 2026-08-27).
     * bulk UPDATE 는 영속성 컨텍스트를 거치지 않으므로 flush+clear 후 다시 읽어 반환한다
     * (CmDashboardItemService.save() 의 "U" 분기와 동일 패턴).</p>
     */
    @Transactional
    public CmDashboardData upsert(CmDashboardData body) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        String existingId = null;
        if (body.getDashboardDataId() != null && !body.getDashboardDataId().isBlank()) {
            // [QueryDSL] 대시보드 3레벨 항목 실데이터 단건 조회
            if (cmDashboardDataRepository.selectById(body.getDashboardDataId()).isPresent()) {
                existingId = body.getDashboardDataId();
            }
        }
        if (existingId == null && body.getItemKey() != null && body.getDataOpts() != null) {
            /* 2026-08-26: UNIQUE 가 (item_key, data_opts, data_opt2s) 세 컬럼으로 늘었다 —
               dataOpt2s 는 nullable(선택 차원이 없으면 비어있는 게 정상)이라 body 에 없어도
               null 그대로 넘긴다(빈 문자열로 임의 보정하지 않는다) */
            Optional<CmDashboardData> existing = cmDashboardDataRepository
                .selectByCoordinate(body.getItemKey(), body.getDataOpts(), body.getDataOpt2s());
            if (existing.isPresent()) existingId = existing.get().getDashboardDataId();
        }

        if (existingId != null) {
            final String targetId = existingId;
            body.setDashboardDataId(targetId);
            body.setUpdBy(authId);
            // [QueryDSL] 대시보드 3레벨 항목 실데이터 선택적 필드 수정
            int affected = cmDashboardDataRepository.updateSelective(body);
            if (affected == 0) throw new CmBizException("데이터 수정에 실패했습니다: " + targetId + "::" + CmUtil.svcCallerInfo(this));
            em.flush();
            em.clear();   // updateSelective 는 벌크 UPDATE 라 영속성 컨텍스트가 옛 값을 들고 있다 — 다시 읽기 전에 비운다
            // [QueryDSL] 대시보드 3레벨 항목 실데이터 단건 조회
            return cmDashboardDataRepository.selectById(targetId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + targetId + "::" + CmUtil.svcCallerInfo(this)));
        }

        body.setDashboardDataId(CmUtil.generateId("cm_dashboard_data"));
        body.setRegBy(authId); body.setRegDate(now);
        body.setUpdBy(authId); body.setUpdDate(now);
        // [쿼리 메서드] 대시보드 3레벨 항목 실데이터 저장
        CmDashboardData saved = cmDashboardDataRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void deleteByItemAndDate(String dashboardItemId, String yyyymmdd) {
        // [쿼리 메서드] 대시보드 3레벨 항목 실데이터 조건별 삭제
        cmDashboardDataRepository.deleteByDashboardItemIdAndYyyymmdd(dashboardItemId, yyyymmdd);
        em.flush();
    }
}
