package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PmCouponService {


    private final PmCouponMapper mapper;
    private final PmCouponRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmCouponDto getById(String id) {
        // pm_coupon :: select one :: id [orm:mybatis]
        PmCouponDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmCouponDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_coupon :: select list :: p [orm:mybatis]
        List<PmCouponDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmCouponDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_coupon :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmCoupon entity) {
        // pm_coupon :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmCoupon create(PmCoupon entity) {
        entity.setCouponId(CmUtil.generateId("pm_coupon"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pm_coupon :: insert or update :: [orm:jpa]
        PmCoupon result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmCoupon save(PmCoupon entity) {
        if (!repository.existsById(entity.getCouponId()))
            throw new CmBizException("존재하지 않는 PmCoupon입니다: " + entity.getCouponId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon :: insert or update :: [orm:jpa]
        PmCoupon result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmCoupon입니다: " + id);
        // pm_coupon :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
