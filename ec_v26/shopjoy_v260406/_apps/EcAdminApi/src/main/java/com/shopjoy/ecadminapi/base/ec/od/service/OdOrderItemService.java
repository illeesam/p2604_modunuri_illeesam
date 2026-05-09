package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderItemMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderItemRepository;
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
public class OdOrderItemService {

    private final OdOrderItemMapper odOrderItemMapper;
    private final OdOrderItemRepository odOrderItemRepository;

    @PersistenceContext
    private EntityManager em;

    public OdOrderItemDto.Item getById(String id) {
        OdOrderItemDto.Item dto = odOrderItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdOrderItem findById(String id) {
        return odOrderItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odOrderItemRepository.existsById(id);
    }

    public List<OdOrderItemDto.Item> getList(OdOrderItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odOrderItemMapper.selectList(req);
    }

    public OdOrderItemDto.PageResponse getPageData(OdOrderItemDto.Request req) {
        PageHelper.addPaging(req);
        OdOrderItemDto.PageResponse res = new OdOrderItemDto.PageResponse();
        List<OdOrderItemDto.Item> list = odOrderItemMapper.selectPageList(req);
        long count = odOrderItemMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdOrderItem create(OdOrderItem body) {
        body.setOrderItemId(CmUtil.generateId("od_order_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdOrderItem saved = odOrderItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderItem save(OdOrderItem entity) {
        if (!existsById(entity.getOrderItemId()))
            throw new CmBizException("존재하지 않는 OdOrderItem입니다: " + entity.getOrderItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItem saved = odOrderItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderItem update(String id, OdOrderItem body) {
        OdOrderItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItem saved = odOrderItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderItem updatePartial(OdOrderItem entity) {
        if (entity.getOrderItemId() == null) throw new CmBizException("orderItemId 가 필요합니다.");
        if (!existsById(entity.getOrderItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odOrderItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdOrderItem entity = findById(id);
        odOrderItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdOrderItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderItemId() != null)
            .map(OdOrderItem::getOrderItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odOrderItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdOrderItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderItemId() != null)
            .toList();
        for (OdOrderItem row : updateRows) {
            OdOrderItem entity = findById(row.getOrderItemId());
            VoUtil.voCopyExclude(row, entity, "orderItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odOrderItemRepository.save(entity);
        }
        em.flush();

        List<OdOrderItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdOrderItem row : insertRows) {
            row.setOrderItemId(CmUtil.generateId("od_order_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odOrderItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
