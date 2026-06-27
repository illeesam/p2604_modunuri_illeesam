package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItemData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemDataRepository;
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

    @PersistenceContext
    private EntityManager em;

    public List<CmDashboardItemData> getList(Map<String, Object> p) {
        String siteId = (String) p.get("siteId");
        String dashboardItemId = (String) p.get("dashboardItemId");
        String yyyymmdd = (String) p.get("yyyymmdd");

        if (siteId != null && dashboardItemId != null && yyyymmdd != null) {
            return List.of(cmDashboardItemDataRepository
                .findBySiteIdAndDashboardItemIdAndYyyymmdd(siteId, dashboardItemId, yyyymmdd)
                .orElse(null));
        }
        if (siteId != null && dashboardItemId != null) {
            return cmDashboardItemDataRepository
                .findBySiteIdAndDashboardItemIdOrderByYyyymmddAscItemDataIdAsc(siteId, dashboardItemId);
        }
        return cmDashboardItemDataRepository.findAll();
    }

    @Transactional
    public CmDashboardItemData upsert(CmDashboardItemData body) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        if (body.getItemDataId() != null && !body.getItemDataId().isBlank()) {
            Optional<CmDashboardItemData> existing = cmDashboardItemDataRepository.findById(body.getItemDataId());
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
        if (body.getSiteId() != null && body.getDashboardItemId() != null && body.getYyyymmdd() != null) {
            Optional<CmDashboardItemData> existing = cmDashboardItemDataRepository
                .findBySiteIdAndDashboardItemIdAndYyyymmdd(body.getSiteId(), body.getDashboardItemId(), body.getYyyymmdd());
            if (existing.isPresent()) {
                CmDashboardItemData entity = existing.get();
                copyFields(body, entity);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmDashboardItemData saved = cmDashboardItemDataRepository.save(entity);
                em.flush();
                return saved;
            }
        }

        body.setItemDataId(CmUtil.generateId("cm_dashboard_item_data"));
        body.setRegBy(authId); body.setRegDate(now);
        body.setUpdBy(authId); body.setUpdDate(now);
        CmDashboardItemData saved = cmDashboardItemDataRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void deleteByItemAndDate(String siteId, String dashboardItemId, String yyyymmdd) {
        cmDashboardItemDataRepository.deleteBySiteIdAndDashboardItemIdAndYyyymmdd(siteId, dashboardItemId, yyyymmdd);
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
