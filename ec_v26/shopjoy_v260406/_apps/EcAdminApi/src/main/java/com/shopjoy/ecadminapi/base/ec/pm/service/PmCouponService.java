package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
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
public class PmCouponService {


    private final PmCouponMapper pmCouponMapper;
    private final PmCouponRepository pmCouponRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmCouponDto getById(String id) {
        // pm_coupon :: select one :: id [orm:mybatis]
        PmCouponDto result = pmCouponMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PmCouponDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_coupon :: select list :: p [orm:mybatis]
        List<PmCouponDto> result = pmCouponMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PmCouponDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_coupon :: select page :: [orm:mybatis]
        return PageResult.of(pmCouponMapper.selectPageList(p), pmCouponMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmCoupon entity) {
        // pm_coupon :: update :: [orm:mybatis]
        int result = pmCouponMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmCoupon create(PmCoupon entity) {
        entity.setCouponId(CmUtil.generateId("pm_coupon"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon :: insert or update :: [orm:jpa]
        PmCoupon result = pmCouponRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmCoupon save(PmCoupon entity) {
        if (!pmCouponRepository.existsById(entity.getCouponId()))
            throw new CmBizException("존재하지 않는 PmCoupon입니다: " + entity.getCouponId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon :: insert or update :: [orm:jpa]
        PmCoupon result = pmCouponRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmCouponRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmCoupon입니다: " + id);
        // pm_coupon :: delete :: id [orm:jpa]
        pmCouponRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmCoupon> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmCoupon row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCouponId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_coupon"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmCouponRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCouponId(), "couponId must not be null");
                PmCoupon entity = pmCouponRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "couponId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmCouponRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCouponId(), "couponId must not be null");
                if (pmCouponRepository.existsById(id)) pmCouponRepository.deleteById(id);
            }
        }
    }
}