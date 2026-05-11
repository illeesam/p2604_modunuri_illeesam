package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponItemRepository;
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
public class PmCouponItemService {

    private final PmCouponItemMapper pmCouponItemMapper;
    private final PmCouponItemRepository pmCouponItemRepository;

    @PersistenceContext
    private EntityManager em;

    public PmCouponItemDto.Item getById(String id) {
        PmCouponItemDto.Item dto = pmCouponItemMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmCouponItem findById(String id) {
        return pmCouponItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmCouponItemRepository.existsById(id);
    }

    public List<PmCouponItemDto.Item> getList(PmCouponItemDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmCouponItemMapper.selectList(VoUtil.voToMap(req));
    }

    public PmCouponItemDto.PageResponse getPageData(PmCouponItemDto.Request req) {
        PageHelper.addPaging(req);
        PmCouponItemDto.PageResponse res = new PmCouponItemDto.PageResponse();
        List<PmCouponItemDto.Item> list = pmCouponItemMapper.selectPageList(VoUtil.voToMap(req));
        long count = pmCouponItemMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmCouponItem create(PmCouponItem body) {
        body.setCouponItemId(CmUtil.generateId("pm_coupon_item"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCouponItem saved = pmCouponItemRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmCouponItem save(PmCouponItem entity) {
        if (!existsById(entity.getCouponItemId()))
            throw new CmBizException("존재하지 않는 PmCouponItem입니다: " + entity.getCouponItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponItem saved = pmCouponItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmCouponItem update(String id, PmCouponItem body) {
        PmCouponItem entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "couponItemId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponItem saved = pmCouponItemRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmCouponItem updateSelective(PmCouponItem entity) {
        if (entity.getCouponItemId() == null) throw new CmBizException("couponItemId 가 필요합니다.");
        if (!existsById(entity.getCouponItemId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCouponItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponItemMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmCouponItem entity = findById(id);
        pmCouponItemRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PmCouponItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCouponItemId() != null)
            .map(PmCouponItem::getCouponItemId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCouponItemRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmCouponItem> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCouponItemId() != null)
            .toList();
        for (PmCouponItem row : updateRows) {
            PmCouponItem entity = findById(row.getCouponItemId());
            VoUtil.voCopyExclude(row, entity, "couponItemId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCouponItemRepository.save(entity);
        }
        em.flush();

        List<PmCouponItem> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCouponItem row : insertRows) {
            row.setCouponItemId(CmUtil.generateId("pm_coupon_item"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCouponItemRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
