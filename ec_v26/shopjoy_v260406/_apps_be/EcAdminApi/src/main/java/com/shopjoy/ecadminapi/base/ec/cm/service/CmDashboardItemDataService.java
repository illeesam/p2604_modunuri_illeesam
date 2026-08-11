package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemDataRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardItemDataService {

    private final CmDashboardItemDataRepository cmDashboardItemDataRepository;
    private final CmDashboardItemRepository cmDashboardItemRepository;
    private final CmDashboardDataSourceRegistry cmDashboardDataSourceRegistry;

    @PersistenceContext
    private EntityManager em;

    public List<CmDashboardItemData> getList(Map<String, Object> p) {
        String siteId = (String) p.get("siteId");
        String dashboardItemId = (String) p.get("dashboardItemId");
        String yyyymmdd = (String) p.get("yyyymmdd");
        String startYmd = (String) p.get("startYmd");
        String endYmd   = (String) p.get("endYmd");

        /* 항목에 실데이터 소스가 걸려 있으면 조회 시점에 실제 테이블을 집계한다.
           소스가 없거나 실행에 실패하면(빈 결과) 아래 저장 데이터로 폴백한다 —
           대시보드 한 칸 때문에 화면 전체가 비지 않게 하는 것이 목적. */
        if (dashboardItemId != null) {
            List<CmDashboardItemData> live = runDataSource(dashboardItemId, siteId);
            if (!live.isEmpty()) return live;
        }

        if (dashboardItemId != null && yyyymmdd != null) {
            return List.of(cmDashboardItemDataRepository
                .findByDashboardItemIdAndYyyymmdd(dashboardItemId, yyyymmdd)
                .orElse(null));
        }
        /* 기간 서버 필터 — startYmd/endYmd (YYYYMMDD) BETWEEN */
        if (dashboardItemId != null && startYmd != null && endYmd != null) {
            return cmDashboardItemDataRepository
                .findByDashboardItemIdAndYyyymmddBetweenOrderByYyyymmddAscItemDataIdAsc(
                    dashboardItemId, startYmd, endYmd);
        }
        if (dashboardItemId != null) {
            return cmDashboardItemDataRepository
                .findByDashboardItemIdOrderByYyyymmddAscItemDataIdAsc(dashboardItemId);
        }
        return cmDashboardItemDataRepository.findAll();
    }

    /** 항목의 data_source_cd 로 실데이터를 만든다. 소스 미지정/미등록/실패면 빈 목록 */
    private List<CmDashboardItemData> runDataSource(String dashboardItemId, String siteId) {
        CmDashboardItem item = cmDashboardItemRepository.findById(dashboardItemId).orElse(null);
        if (item == null || !cmDashboardDataSourceRegistry.has(item.getDataSourceCd())) return List.of();
        return cmDashboardDataSourceRegistry.run(item.getDataSourceCd(), siteId);
    }

    @Transactional
    public CmDashboardItemData upsert(CmDashboardItemData body) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        if (body.getDashboardItemDataId() != null && !body.getDashboardItemDataId().isBlank()) {
            Optional<CmDashboardItemData> existing = cmDashboardItemDataRepository.findById(body.getDashboardItemDataId());
            if (existing.isPresent()) {
                CmDashboardItemData entity = existing.get();
                copyFields(body, entity);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmDashboardItemData saved = cmDashboardItemDataRepository.save(entity);
                em.flush();
                return saved;
            }
        }

        // composite key lookup
        if (body.getDashboardItemId() != null && body.getYyyymmdd() != null) {
            Optional<CmDashboardItemData> existing = cmDashboardItemDataRepository
                .findByDashboardItemIdAndYyyymmdd(body.getDashboardItemId(), body.getYyyymmdd());
            if (existing.isPresent()) {
                CmDashboardItemData entity = existing.get();
                copyFields(body, entity);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmDashboardItemData saved = cmDashboardItemDataRepository.save(entity);
                em.flush();
                return saved;
            }
        }

        body.setDashboardItemDataId(CmUtil.generateId("cm_dashboard_item_data"));
        body.setRegBy(authId); body.setRegDate(now);
        body.setUpdBy(authId); body.setUpdDate(now);
        CmDashboardItemData saved = cmDashboardItemDataRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void deleteByItemAndDate(String dashboardItemId, String yyyymmdd) {
        cmDashboardItemDataRepository.deleteByDashboardItemIdAndYyyymmdd(dashboardItemId, yyyymmdd);
        em.flush();
    }

    private void copyFields(CmDashboardItemData src, CmDashboardItemData dst) {
        if (src.getDeptId() != null)  dst.setDeptId(src.getDeptId());
        if (src.getUserId() != null)  dst.setUserId(src.getUserId());
        if (src.getDataJson() != null) dst.setDataJson(src.getDataJson());
        if (src.getCol1Nm() != null)  dst.setCol1Nm(src.getCol1Nm());
        if (src.getCol1Num() != null) dst.setCol1Num(src.getCol1Num());
        if (src.getCol2Nm() != null)  dst.setCol2Nm(src.getCol2Nm());
        if (src.getCol2Num() != null) dst.setCol2Num(src.getCol2Num());
        if (src.getCol3Nm() != null)  dst.setCol3Nm(src.getCol3Nm());
        if (src.getCol3Num() != null) dst.setCol3Num(src.getCol3Num());
        if (src.getCol4Nm() != null)  dst.setCol4Nm(src.getCol4Nm());
        if (src.getCol4Num() != null) dst.setCol4Num(src.getCol4Num());
        if (src.getCol5Nm() != null)  dst.setCol5Nm(src.getCol5Nm());
        if (src.getCol5Num() != null) dst.setCol5Num(src.getCol5Num());
        if (src.getCol6Nm() != null)  dst.setCol6Nm(src.getCol6Nm());
        if (src.getCol6Num() != null) dst.setCol6Num(src.getCol6Num());
        if (src.getCol7Nm() != null)  dst.setCol7Nm(src.getCol7Nm());
        if (src.getCol7Num() != null) dst.setCol7Num(src.getCol7Num());
        if (src.getCol8Nm() != null)  dst.setCol8Nm(src.getCol8Nm());
        if (src.getCol8Num() != null) dst.setCol8Num(src.getCol8Num());
        if (src.getCol9Nm() != null)  dst.setCol9Nm(src.getCol9Nm());
        if (src.getCol9Num() != null) dst.setCol9Num(src.getCol9Num());
    }
}
