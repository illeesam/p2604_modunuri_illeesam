package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmDashboardItem;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmDashboardItemRepository;
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
 * 대시보드 패널 정의 서비스 — CmDashboardItem CRUD.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmDashboardItemService {

    private final CmDashboardItemRepository cmDashboardItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* ── 조회 ──────────────────────────────────────────────────── */

    /** getById — 단건조회. 없으면 CmBizException */
    public CmDashboardItem getById(String id) {
        return cmDashboardItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** getByIdOptional — 단건조회 (Optional 반환) */
    public Optional<CmDashboardItem> getByIdOptional(String id) {
        return cmDashboardItemRepository.findById(id);
    }

    /**
     * getList — 목록조회.
     * 파라미터: siteId, uiNm, useYn (모두 선택)
     * useYn 있으면 useYn 필터 적용, 없으면 전체 조회.
     */
    public List<CmDashboardItem> getList(Map<String, Object> p) {
        String siteId = (String) p.get("siteId");
        String uiNm   = (String) p.get("uiNm");
        String useYn  = (String) p.get("useYn");

        if (siteId != null && uiNm != null && useYn != null) {
            return cmDashboardItemRepository.findBySiteIdAndUiNmAndUseYnOrderBySortOrdAsc(siteId, uiNm, useYn);
        }
        if (siteId != null && uiNm != null) {
            return cmDashboardItemRepository.findBySiteIdAndUiNmOrderBySortOrdAsc(siteId, uiNm);
        }
        return cmDashboardItemRepository.findAll();
    }

    /* ── 변경 ──────────────────────────────────────────────────── */

    /**
     * save — rowStatus(I/U/D/M) 단건 분기 처리.
     * cmd: "base"=기본 흐름.
     */
    @Transactional
    public CmDashboardItem save(String cmd, CmDashboardItem body) {
        if ("base".equals(cmd)) {
            return saveOneBase(body);
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /**
     * saveList — 일괄 저장 (cmd 분기).
     * cmd: "base"=기본 흐름.
     */
    @Transactional
    public void saveList(String cmd, List<CmDashboardItem> rows) {
        if ("base".equals(cmd)) {
            saveListBase(rows);
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /* ── 내부 헬퍼 ─────────────────────────────────────────────── */

    private CmDashboardItem saveOneBase(CmDashboardItem body) {
        String rowStatus = body.getRowStatus();
        String authId    = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (body.getDashboardItemId() == null || body.getDashboardItemId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            CmUtil.requireId(body.getDashboardItemId(), "dashboardItemId", this);
            if (!cmDashboardItemRepository.existsById(body.getDashboardItemId()))
                throw new CmBizException("존재하지 않는 데이터입니다: " + body.getDashboardItemId() + "::" + CmUtil.svcCallerInfo(this));
            cmDashboardItemRepository.deleteById(body.getDashboardItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            body.setDashboardItemId(CmUtil.generateId("cm_dashboard_item"));
            body.setRegBy(authId); body.setRegDate(now);
            body.setUpdBy(authId); body.setUpdDate(now);
            CmDashboardItem saved = cmDashboardItemRepository.save(body);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            CmUtil.requireId(body.getDashboardItemId(), "dashboardItemId", this);
            CmDashboardItem entity = getById(body.getDashboardItemId());
            VoUtil.voCopyExclude(body, entity, "dashboardItemId^regBy^regDate");
            entity.setUpdBy(authId);
            entity.setUpdDate(now);
            CmDashboardItem saved = cmDashboardItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            em.flush();
            return saved;
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
    }

    private void saveListBase(List<CmDashboardItem> rows) {
        for (CmDashboardItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getDashboardItemId() == null || row.getDashboardItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, CmDashboardItem::getDashboardItemId, "U", "dashboardItemId", this);
        CmUtil.requireRowIds(rows, CmDashboardItem::getDashboardItemId, "D", "dashboardItemId", this);

        String authId    = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(CmDashboardItem::getDashboardItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmDashboardItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE
        List<CmDashboardItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (CmDashboardItem row : updateRows) {
            CmDashboardItem entity = getById(row.getDashboardItemId());
            VoUtil.voCopyExclude(row, entity, "dashboardItemId^regBy^regDate");
            entity.setUpdBy(authId);
            entity.setUpdDate(now);
            cmDashboardItemRepository.save(entity);
        }

        // 3단계: INSERT
        List<CmDashboardItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmDashboardItem row : insertRows) {
            row.setDashboardItemId(CmUtil.generateId("cm_dashboard_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmDashboardItemRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}
