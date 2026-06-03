package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DpPanelService {

    private final DpPanelRepository dpPanelRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 패널 키조회 */
    public DpPanelDto.Item getById(String id) {
        DpPanelDto.Item dto = dpPanelRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpPanelDto.Item getByIdOrNull(String id) {
        return dpPanelRepository.selectById(id).orElse(null);
    }

    /* 전시 패널 상세조회 */
    public DpPanel findById(String id) {
        return dpPanelRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpPanel findByIdOrNull(String id) {
        return dpPanelRepository.findById(id).orElse(null);
    }

    /* 전시 패널 키검증 */
    public boolean existsById(String id) {
        return dpPanelRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpPanelRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 패널 목록조회 */
    public List<DpPanelDto.Item> getList(DpPanelDto.Request req) {
        return dpPanelRepository.selectList(req);
    }

    /* 전시 패널 페이지조회 */
    public DpPanelDto.PageResponse getPageData(DpPanelDto.Request req) {
        PageHelper.addPaging(req);
        return dpPanelRepository.selectPageData(req);
    }

    /* 전시 패널 등록 */
    @Transactional
    public DpPanel create(DpPanel body) {
        body.setPanelId(CmUtil.generateId("dp_panel"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 전시 패널 수정 */
    @Transactional
    public DpPanel update(String id, DpPanel body) {
        CmUtil.requireId(id, "id", this);
        DpPanel entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "panelId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanel saved = dpPanelRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 패널 수정 */
    @Transactional
    public DpPanel updateSelective(DpPanel entity) {
        if (entity.getPanelId() == null) throw new CmBizException("panelId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPanelId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPanelId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpPanelRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 전시 패널 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpPanel entity = findById(id);
        dpPanelRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpPanel saveOneBase(DpPanel entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getPanelId() == null || entity.getPanelId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getPanelId() == null)
                throw new CmBizException("삭제 대상 panelId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!dpPanelRepository.existsById(entity.getPanelId()))
                throw new CmBizException("존재하지 않는 DpPanel입니다: " + entity.getPanelId() + "::" + CmUtil.svcCallerInfo(this));
            dpPanelRepository.deleteById(entity.getPanelId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setPanelId(CmUtil.generateId("dp_panel"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            DpPanel saved = dpPanelRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getPanelId() == null)
                throw new CmBizException("수정 대상 panelId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = dpPanelRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 DpPanel입니다: " + entity.getPanelId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getPanelId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<DpPanel> rows) {
        /* 0단계: rowStatus 정규화 */
        for (DpPanel row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getPanelId() == null || row.getPanelId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, DpPanel::getPanelId, "U", "panelId", this);
        CmUtil.requireRowIds(rows, DpPanel::getPanelId, "D", "panelId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(DpPanel::getPanelId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpPanelRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<DpPanel> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (DpPanel row : updateRows) {
            row.setUpdBy(authId);
            int affected = dpPanelRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPanelId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<DpPanel> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpPanel row : insertRows) {
            row.setPanelId(CmUtil.generateId("dp_panel"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpPanelRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;
    }

    /** getPathTreeNodeCounts — 표시경로 노드별 DpPanel 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(DpPanelDto.Request req) {
        return dpPanelRepository.selectPathTreePanelCnts(req);
    }
}
