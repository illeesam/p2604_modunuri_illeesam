package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponUsageMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponUsageRepository;
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
public class PmCouponUsageService {


    private final PmCouponUsageMapper pmCouponUsageMapper;
    private final PmCouponUsageRepository pmCouponUsageRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmCouponUsageDto getById(String id) {
        // pm_coupon_usage :: select one :: id [orm:mybatis]
        PmCouponUsageDto result = pmCouponUsageMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PmCouponUsageDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_coupon_usage :: select list :: p [orm:mybatis]
        List<PmCouponUsageDto> result = pmCouponUsageMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PmCouponUsageDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_coupon_usage :: select page :: [orm:mybatis]
        return PageResult.of(pmCouponUsageMapper.selectPageList(p), pmCouponUsageMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmCouponUsage entity) {
        // pm_coupon_usage :: update :: [orm:mybatis]
        int result = pmCouponUsageMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmCouponUsage create(PmCouponUsage entity) {
        entity.setUsageId(CmUtil.generateId("pm_coupon_usage"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon_usage :: insert or update :: [orm:jpa]
        PmCouponUsage result = pmCouponUsageRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmCouponUsage save(PmCouponUsage entity) {
        if (!pmCouponUsageRepository.existsById(entity.getUsageId()))
            throw new CmBizException("존재하지 않는 PmCouponUsage입니다: " + entity.getUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon_usage :: insert or update :: [orm:jpa]
        PmCouponUsage result = pmCouponUsageRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmCouponUsageRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmCouponUsage입니다: " + id);
        // pm_coupon_usage :: delete :: id [orm:jpa]
        pmCouponUsageRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmCouponUsage> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmCouponUsage row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setUsageId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_coupon_usage"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmCouponUsageRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getUsageId(), "usageId must not be null");
                PmCouponUsage entity = pmCouponUsageRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "usageId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmCouponUsageRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getUsageId(), "usageId must not be null");
                if (pmCouponUsageRepository.existsById(id)) pmCouponUsageRepository.deleteById(id);
            }
        }
    }
}