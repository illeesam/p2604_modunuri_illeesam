package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSetItemRepository;
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
public class PdProdSetItemService {

    private final PdProdSetItemRepository pdProdSetItemRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdSetItemDto.Item getById(String id) {
        PdProdSetItemDto.Item dto = pdProdSetItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdSetItemDto.Item getByIdOrNull(String id) {
        return pdProdSetItemRepository.selectById(id).orElse(null);
    }

    public PdProdSetItem findById(String id) {
        return pdProdSetItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdSetItem findByIdOrNull(String id) {
        return pdProdSetItemRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdSetItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdSetItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdProdSetItemDto.Item> getList(PdProdSetItemDto.Request req) {
        return pdProdSetItemRepository.selectList(req);
    }

    public PdProdSetItemDto.PageResponse getPageData(PdProdSetItemDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdSetItemRepository.selectPageList(req);
    }

    @Transactional
    public PdProdSetItem create(PdProdSetItem body) {
        body.setSetItemId(CmUtil.generateId("pd_prod_set_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdSetItem saved = pdProdSetItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSetItem save(PdProdSetItem entity) {
        if (!existsById(entity.getSetItemId()))
            throw new CmBizException("존재하지 않는 PdProdSetItem입니다: " + entity.getSetItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdSetItem saved = pdProdSetItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSetItem update(String id, PdProdSetItem body) {
        PdProdSetItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "setItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdSetItem saved = pdProdSetItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSetItem updateSelective(PdProdSetItem entity) {
        if (entity.getSetItemId() == null) throw new CmBizException("setItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSetItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSetItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdSetItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdSetItem entity = findById(id);
        pdProdSetItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdProdSetItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSetItemId() != null)
            .map(PdProdSetItem::getSetItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdSetItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdSetItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSetItemId() != null)
            .toList();
        for (PdProdSetItem row : updateRows) {
            PdProdSetItem entity = findById(row.getSetItemId());
            VoUtil.voCopyExclude(row, entity, "setItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdSetItemRepository.save(entity);
        }
        em.flush();

        List<PdProdSetItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdSetItem row : insertRows) {
            row.setSetItemId(CmUtil.generateId("pd_prod_set_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdSetItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
