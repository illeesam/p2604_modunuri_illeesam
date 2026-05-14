package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptItemRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdProdOptItemService {

    private final PdProdOptItemRepository pdProdOptItemRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdOptItemDto.Item getById(String id) {
        PdProdOptItemDto.Item dto = pdProdOptItemRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOptItemDto.Item getByIdOrNull(String id) {
        return pdProdOptItemRepository.selectById(id).orElse(null);
    }

    public PdProdOptItem findById(String id) {
        return pdProdOptItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdOptItem findByIdOrNull(String id) {
        return pdProdOptItemRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdOptItemRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdOptItemRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdProdOptItemDto.Item> getList(PdProdOptItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdOptItemRepository.selectList(req);
    }

    public PdProdOptItemDto.PageResponse getPageData(PdProdOptItemDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdOptItemRepository.selectPageList(req);
    }

    @Transactional
    public PdProdOptItem create(PdProdOptItem body) {
        body.setOptItemId(CmUtil.generateId("pd_prod_opt_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdOptItem saved = pdProdOptItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdOptItem save(PdProdOptItem entity) {
        if (!existsById(entity.getOptItemId()))
            throw new CmBizException("존재하지 않는 PdProdOptItem입니다: " + entity.getOptItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOptItem saved = pdProdOptItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdOptItem update(String id, PdProdOptItem body) {
        PdProdOptItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "optItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdOptItem saved = pdProdOptItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdOptItem updateSelective(PdProdOptItem entity) {
        if (entity.getOptItemId() == null) throw new CmBizException("optItemId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOptItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOptItemId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdOptItemRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdOptItem entity = findById(id);
        pdProdOptItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdProdOptItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOptItemId() != null)
            .map(PdProdOptItem::getOptItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdOptItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdOptItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOptItemId() != null)
            .toList();
        for (PdProdOptItem row : updateRows) {
            PdProdOptItem entity = findById(row.getOptItemId());
            VoUtil.voCopyExclude(row, entity, "optItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdOptItemRepository.save(entity);
        }
        em.flush();

        List<PdProdOptItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdOptItem row : insertRows) {
            row.setOptItemId(CmUtil.generateId("pd_prod_opt_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdOptItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
