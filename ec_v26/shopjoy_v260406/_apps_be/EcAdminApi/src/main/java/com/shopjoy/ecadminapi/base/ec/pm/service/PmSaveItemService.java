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
        return pmSaveItemRepository.selectPageList(req);
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

    /* 적립금 대상 상품 저장 */
    @Transactional
    public PmSaveItem save(PmSaveItem entity) {
        if (!existsById(entity.getSaveItemId()))
            throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + entity.getSaveItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveItem saved = pmSaveItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금 대상 상품 수정 */
    @Transactional
    public PmSaveItem update(String id, PmSaveItem body) {
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
        PmSaveItem entity = findById(id);
        pmSaveItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 적립금 대상 상품 목록저장 */
    @Transactional
    public void saveList(List<PmSaveItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSaveItemId() != null)
            .map(PmSaveItem::getSaveItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmSaveItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmSaveItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSaveItemId() != null)
            .toList();
        for (PmSaveItem row : updateRows) {
            PmSaveItem entity = findById(row.getSaveItemId());
            VoUtil.voCopyExclude(row, entity, "saveItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmSaveItemRepository.save(entity);
        }
        em.flush();

        List<PmSaveItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmSaveItem row : insertRows) {
            row.setSaveItemId(CmUtil.generateId("pm_save_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmSaveItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
