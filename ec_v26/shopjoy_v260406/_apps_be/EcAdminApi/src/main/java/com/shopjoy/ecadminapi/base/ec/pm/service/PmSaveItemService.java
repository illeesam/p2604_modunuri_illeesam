package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveItemMapper;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmSaveItemService {

    private final PmSaveItemMapper pmSaveItemMapper;
    private final PmSaveItemRepository pmSaveItemRepository;

    @PersistenceContext
    private EntityManager em;

    public PmSaveItemDto.Item getById(String id) {
        PmSaveItemDto.Item dto = pmSaveItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmSaveItem findById(String id) {
        return pmSaveItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmSaveItemRepository.existsById(id);
    }

    public List<PmSaveItemDto.Item> getList(PmSaveItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmSaveItemMapper.selectList(VoUtil.voToMap(req));
    }

    public PmSaveItemDto.PageResponse getPageData(PmSaveItemDto.Request req) {
        PageHelper.addPaging(req);
        PmSaveItemDto.PageResponse res = new PmSaveItemDto.PageResponse();
        List<PmSaveItemDto.Item> list = pmSaveItemMapper.selectPageList(VoUtil.voToMap(req));
        long count = pmSaveItemMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmSaveItem create(PmSaveItem body) {
        body.setSaveItemId(CmUtil.generateId("pm_save_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSaveItem saved = pmSaveItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmSaveItem save(PmSaveItem entity) {
        if (!existsById(entity.getSaveItemId()))
            throw new CmBizException("존재하지 않는 PmSaveItem입니다: " + entity.getSaveItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveItem saved = pmSaveItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmSaveItem update(String id, PmSaveItem body) {
        PmSaveItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveItem saved = pmSaveItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmSaveItem updateSelective(PmSaveItem entity) {
        if (entity.getSaveItemId() == null) throw new CmBizException("saveItemId 가 필요합니다.");
        if (!existsById(entity.getSaveItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmSaveItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmSaveItem entity = findById(id);
        pmSaveItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

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
