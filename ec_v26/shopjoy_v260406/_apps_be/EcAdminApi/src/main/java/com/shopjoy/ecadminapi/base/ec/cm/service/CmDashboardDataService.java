package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardData;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardDataRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
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
 * 대시보드 집계 데이터 서비스 — CmDashboardData CRUD + upsert.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardDataService {

    private final CmDashboardDataRepository cmDashboardDataRepository;

    @PersistenceContext
    private EntityManager em;

    /* ── 조회 ──────────────────────────────────────────────────── */

    /**
     * getList — 목록조회.
     * 파라미터: siteId, dashboardItemId, yyyymmdd (모두 선택)
     * siteId+uiNm+yyyymmdd 있으면 해당 조건으로 조회, 없으면 전체 조회.
     */
    public List<CmDashboardData> getList(Map<String, Object> p) {
        String siteId           = (String) p.get("siteId");
        String uiNm             = (String) p.get("uiNm");
        String dashboardItemId  = (String) p.get("dashboardItemId");
        String yyyymmdd         = (String) p.get("yyyymmdd");

        if (siteId != null && uiNm != null && yyyymmdd != null) {
            return cmDashboardDataRepository.findBySiteIdAndUiNmAndYyyymmddOrderByDashboardItemIdAsc(siteId, uiNm, yyyymmdd);
        }
        if (siteId != null && dashboardItemId != null && yyyymmdd != null) {
            Optional<CmDashboardData> found =
                cmDashboardDataRepository.findBySiteIdAndDashboardItemIdAndYyyymmdd(siteId, dashboardItemId, yyyymmdd);
            return found.map(List::of).orElseGet(List::of);
        }
        return cmDashboardDataRepository.findAll();
    }

    /* ── 변경 ──────────────────────────────────────────────────── */

    /**
     * upsert — ID 없으면 신규 생성, 있으면 기존 행 수정.
     * siteId+dashboardItemId+yyyymmdd 조합으로 기존 행 탐색 후 없으면 INSERT, 있으면 UPDATE.
     */
    @Transactional
    public CmDashboardData upsert(CmDashboardData body) {
        String authId    = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // ID 명시 없으면 siteId+dashboardItemId+yyyymmdd 로 기존 행 탐색
        if (body.getDashboardDataId() == null || body.getDashboardDataId().isBlank()) {
            if (body.getSiteId() != null && body.getDashboardItemId() != null && body.getYyyymmdd() != null) {
                Optional<CmDashboardData> existing = cmDashboardDataRepository
                    .findBySiteIdAndDashboardItemIdAndYyyymmdd(
                        body.getSiteId(), body.getDashboardItemId(), body.getYyyymmdd());
                if (existing.isPresent()) {
                    body.setDashboardDataId(existing.get().getDashboardDataId());
                }
            }
        }

        if (body.getDashboardDataId() == null || body.getDashboardDataId().isBlank()) {
            // INSERT
            body.setDashboardDataId(CmUtil.generateId("cm_dashboard_data"));
            body.setRegBy(authId); body.setRegDate(now);
            body.setUpdBy(authId); body.setUpdDate(now);
            CmDashboardData saved = cmDashboardDataRepository.save(body);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            em.flush();
            return saved;
        } else {
            // UPDATE
            CmDashboardData entity = cmDashboardDataRepository.findById(body.getDashboardDataId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + body.getDashboardDataId() + "::" + CmUtil.svcCallerInfo(this)));
            VoUtil.voCopyExclude(body, entity, "dashboardDataId^regBy^regDate");
            entity.setUpdBy(authId);
            entity.setUpdDate(now);
            CmDashboardData saved = cmDashboardDataRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            em.flush();
            return saved;
        }
    }

    /**
     * deleteByItemAndDate — siteId+dashboardItemId+yyyymmdd 조합으로 삭제.
     */
    @Transactional
    public void deleteByItemAndDate(String siteId, String dashboardItemId, String yyyymmdd) {
        CmUtil.requireId(siteId, "siteId", this);
        CmUtil.requireId(dashboardItemId, "dashboardItemId", this);
        CmUtil.requireId(yyyymmdd, "yyyymmdd", this);
        cmDashboardDataRepository.deleteBySiteIdAndDashboardItemIdAndYyyymmdd(siteId, dashboardItemId, yyyymmdd);
        em.flush();
    }
}
