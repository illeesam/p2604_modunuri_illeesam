package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponIssueMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponIssueRepository;
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
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PmCouponIssueService {


    private final PmCouponIssueMapper mapper;
    private final PmCouponIssueRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmCouponIssueDto getById(String id) {
        // pm_coupon_issue :: select one :: id [orm:mybatis]
        PmCouponIssueDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmCouponIssueDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_coupon_issue :: select list :: p [orm:mybatis]
        List<PmCouponIssueDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmCouponIssueDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_coupon_issue :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmCouponIssue entity) {
        // pm_coupon_issue :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmCouponIssue create(PmCouponIssue entity) {
        entity.setIssueId(CmUtil.generateId("pm_coupon_issue"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon_issue :: insert or update :: [orm:jpa]
        PmCouponIssue result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmCouponIssue save(PmCouponIssue entity) {
        if (!repository.existsById(entity.getIssueId()))
            throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + entity.getIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_coupon_issue :: insert or update :: [orm:jpa]
        PmCouponIssue result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + id);
        // pm_coupon_issue :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
