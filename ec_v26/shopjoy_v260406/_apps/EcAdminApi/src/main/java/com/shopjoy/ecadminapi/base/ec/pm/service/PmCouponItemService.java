package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponItemMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponItemRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class PmCouponItemService {


    private final PmCouponItemMapper pmCouponItemMapper;
    private final PmCouponItemRepository pmCouponItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmCouponItemDto getById(String id) {
        // pm_coupon_item :: select one :: id [orm:mybatis]
        PmCouponItemDto result = pmCouponItemMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmCouponItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_coupon_item :: select list :: p [orm:mybatis]
        List<PmCouponItemDto> result = pmCouponItemMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmCouponItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_coupon_item :: select page :: [orm:mybatis]
        return PageResult.of(pmCouponItemMapper.selectPageList(p), pmCouponItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmCouponItem entity) {
        // pm_coupon_item :: update :: [orm:mybatis]
        int result = pmCouponItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmCouponItem create(PmCouponItem entity) {
        entity.setCouponItemId(CmUtil.generateId("pm_coupon_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon_item :: insert or update :: [orm:jpa]
        PmCouponItem result = pmCouponItemRepository.save(entity);
        return result;
    }

    @Transactional
    public PmCouponItem save(PmCouponItem entity) {
        if (!pmCouponItemRepository.existsById(entity.getCouponItemId()))
            throw new CmBizException("존재하지 않는 PmCouponItem입니다: " + entity.getCouponItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon_item :: insert or update :: [orm:jpa]
        PmCouponItem result = pmCouponItemRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pmCouponItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmCouponItem입니다: " + id);
        // pm_coupon_item :: delete :: id [orm:jpa]
        pmCouponItemRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PmCouponItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmCouponItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCouponItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_coupon_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmCouponItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCouponItemId(), "couponItemId must not be null");
                PmCouponItem entity = pmCouponItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "couponItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmCouponItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCouponItemId(), "couponItemId must not be null");
                if (pmCouponItemRepository.existsById(id)) pmCouponItemRepository.deleteById(id);
            }
        }
    }
}