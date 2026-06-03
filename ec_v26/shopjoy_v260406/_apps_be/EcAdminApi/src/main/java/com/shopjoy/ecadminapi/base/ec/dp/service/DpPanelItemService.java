package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelItemRepository;
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
public class DpPanelItemService {

    private final DpPanelItemRepository dpPanelItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 패널 아이템 키조회 */
    public DpPanelItemDto.Item getById(String id) {
        DpPanelItemDto.Item dto = dpPanelItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpPanelItemDto.Item getByIdOrNull(String id) {
        return dpPanelItemRepository.selectById(id).orElse(null);
    }

    /* 전시 패널 아이템 상세조회 */
    public DpPanelItem findById(String id) {
        return dpPanelItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpPanelItem findByIdOrNull(String id) {
        return dpPanelItemRepository.findById(id).orElse(null);
    }

    /* 전시 패널 아이템 키검증 */
    public boolean existsById(String id) {
        return dpPanelItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpPanelItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 패널 아이템 목록조회 */
    public List<DpPanelItemDto.Item> getList(DpPanelItemDto.Request req) {
        return dpPanelItemRepository.selectList(req);
    }

    /* 전시 패널 아이템 페이지조회 */
    public DpPanelItemDto.PageResponse getPageData(DpPanelItemDto.Request req) {
        PageHelper.addPaging(req);
        return dpPanelItemRepository.selectPageData(req);
    }

    /* 전시 패널 아이템 등록 */
    @Transactional
    public DpPanelItem create(DpPanelItem body) {
        body.setPanelItemId(CmUtil.generateId("dp_panel_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpPanelItem saved = dpPanelItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 전시 패널 아이템 수정 */
    @Transactional
    public DpPanelItem update(String id, DpPanelItem body) {
        CmUtil.requireId(id, "id", this);
        DpPanelItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "panelItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpPanelItem saved = dpPanelItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 패널 아이템 수정 */
    @Transactional
    public DpPanelItem updateSelective(DpPanelItem entity) {
        if (entity.getPanelItemId() == null) throw new CmBizException("panelItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPanelItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPanelItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpPanelItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 전시 패널 아이템 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpPanelItem entity = findById(id);
        dpPanelItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpPanelItem saveOneBase(DpPanelItem entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getPanelItemId() == null || entity.getPanelItemId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getPanelItemId() == null)
                throw new CmBizException("삭제 대상 panelItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!dpPanelItemRepository.existsById(entity.getPanelItemId()))
                throw new CmBizException("존재하지 않는 DpPanelItem입니다: " + entity.getPanelItemId() + "::" + CmUtil.svcCallerInfo(this));
            dpPanelItemRepository.deleteById(entity.getPanelItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setPanelItemId(CmUtil.generateId("dp_panel_item"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            DpPanelItem saved = dpPanelItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getPanelItemId() == null)
                throw new CmBizException("수정 대상 panelItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = dpPanelItemRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 DpPanelItem입니다: " + entity.getPanelItemId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getPanelItemId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<DpPanelItem> rows) {
        /* 0단계: rowStatus 정규화 */
        for (DpPanelItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getPanelItemId() == null || row.getPanelItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, DpPanelItem::getPanelItemId, "U", "panelItemId", this);
        CmUtil.requireRowIds(rows, DpPanelItem::getPanelItemId, "D", "panelItemId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(DpPanelItem::getPanelItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpPanelItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<DpPanelItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (DpPanelItem row : updateRows) {
            row.setUpdBy(authId);
            int affected = dpPanelItemRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPanelItemId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<DpPanelItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpPanelItem row : insertRows) {
            row.setPanelItemId(CmUtil.generateId("dp_panel_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpPanelItemRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
