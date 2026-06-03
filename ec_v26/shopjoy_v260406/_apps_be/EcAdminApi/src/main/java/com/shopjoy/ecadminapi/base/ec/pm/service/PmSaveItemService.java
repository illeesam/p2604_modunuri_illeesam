package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveItemRepository;
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
public class PmSaveItemService {

    private final PmSaveItemRepository pmSaveItemRepository;

    @PersistenceContext
    private EntityManager em;

    /* 적립금 대상 상품 키조회 */
    public PmSaveItemDto.Item getById(String id) {
        PmSaveItemDto.Item dto = pmSaveItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveItemDto.Item getByIdOrNull(String id) {
        return pmSaveItemRepository.selectById(id).orElse(null);
    }

    /* 적립금 대상 상품 상세조회 */
    public PmSaveItem findById(String id) {
        return pmSaveItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveItem findByIdOrNull(String id) {
        return pmSaveItemRepository.findById(id).orElse(null);
    }

    /* 적립금 대상 상품 키검증 */
    public boolean existsById(String id) {
        return pmSaveItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmSaveItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 적립금 대상 상품 목록조회 */
    public List<PmSaveItemDto.Item> getList(PmSaveItemDto.Request req) {
        return pmSaveItemRepository.selectList(req);
    }

    /* 적립금 대상 상품 페이지조회 */
    public PmSaveItemDto.PageResponse getPageData(PmSaveItemDto.Request req) {
        PageHelper.addPaging(req);
        return pmSaveItemRepository.selectPageData(req);
    }

    /* 적립금 대상 상품 등록 */
    @Transactional
    public PmSaveItem create(PmSaveItem body) {
        body.setSaveItemId(CmUtil.generateId("pm_save_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSaveItem saved = pmSaveItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 적립금 대상 상품 수정 */
    @Transactional
    public PmSaveItem update(String id, PmSaveItem body) {
        CmUtil.requireId(id, "id", this);
        PmSaveItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveItem saved = pmSaveItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금 대상 상품 수정 */
    @Transactional
    public PmSaveItem updateSelective(PmSaveItem entity) {
        if (entity.getSaveItemId() == null) throw new CmBizException("saveItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSaveItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmSaveItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 적립금 대상 상품 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmSaveItem entity = findById(id);
        pmSaveItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmSaveItem saveOneBase(PmSaveItem entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getSaveItemId() == null || entity.getSaveItemId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getSaveItemId() == null)
                throw new CmBizException("삭제 대상 saveItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pmSaveItemRepository.existsById(entity.getSaveItemId()))
                throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + entity.getSaveItemId() + "::" + CmUtil.svcCallerInfo(this));
            pmSaveItemRepository.deleteById(entity.getSaveItemId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSaveItemId(CmUtil.generateId("pm_save_item"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PmSaveItem saved = pmSaveItemRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSaveItemId() == null)
                throw new CmBizException("수정 대상 saveItemId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pmSaveItemRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + entity.getSaveItemId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getSaveItemId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmSaveItem> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmSaveItem row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSaveItemId() == null || row.getSaveItemId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmSaveItem::getSaveItemId, "U", "saveItemId", this);
        CmUtil.requireRowIds(rows, PmSaveItem::getSaveItemId, "D", "saveItemId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmSaveItem::getSaveItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmSaveItemRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmSaveItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmSaveItem row : updateRows) {
            row.setUpdBy(authId);
            int affected = pmSaveItemRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSaveItemId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmSaveItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmSaveItem row : insertRows) {
            row.setSaveItemId(CmUtil.generateId("pm_save_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmSaveItemRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
