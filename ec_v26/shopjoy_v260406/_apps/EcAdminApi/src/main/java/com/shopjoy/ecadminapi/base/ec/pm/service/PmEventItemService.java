package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventItemRepository;
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
public class PmEventItemService {

    private final PmEventItemMapper pmEventItemMapper;
    private final PmEventItemRepository pmEventItemRepository;

    @PersistenceContext
    private EntityManager em;

    public PmEventItemDto.Item getById(String id) {
        PmEventItemDto.Item dto = pmEventItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmEventItem findById(String id) {
        return pmEventItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmEventItemRepository.existsById(id);
    }

    public List<PmEventItemDto.Item> getList(PmEventItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmEventItemMapper.selectList(req);
    }

    public PmEventItemDto.PageResponse getPageData(PmEventItemDto.Request req) {
        PageHelper.addPaging(req);
        PmEventItemDto.PageResponse res = new PmEventItemDto.PageResponse();
        List<PmEventItemDto.Item> list = pmEventItemMapper.selectPageList(req);
        long count = pmEventItemMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmEventItem create(PmEventItem body) {
        body.setEventItemId(CmUtil.generateId("pm_event_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmEventItem saved = pmEventItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmEventItem save(PmEventItem entity) {
        if (!existsById(entity.getEventItemId()))
            throw new CmBizException("존재하지 않는 PmEventItem입니다: " + entity.getEventItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEventItem saved = pmEventItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmEventItem update(String id, PmEventItem body) {
        PmEventItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "eventItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEventItem saved = pmEventItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmEventItem updatePartial(PmEventItem entity) {
        if (entity.getEventItemId() == null) throw new CmBizException("eventItemId 가 필요합니다.");
        if (!existsById(entity.getEventItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getEventItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmEventItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmEventItem entity = findById(id);
        pmEventItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PmEventItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getEventItemId() != null)
            .map(PmEventItem::getEventItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmEventItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmEventItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getEventItemId() != null)
            .toList();
        for (PmEventItem row : updateRows) {
            PmEventItem entity = findById(row.getEventItemId());
            VoUtil.voCopyExclude(row, entity, "eventItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmEventItemRepository.save(entity);
        }
        em.flush();

        List<PmEventItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmEventItem row : insertRows) {
            row.setEventItemId(CmUtil.generateId("pm_event_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmEventItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
