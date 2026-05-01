package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmDiscntUsageMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntUsageRepository;
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
public class PmDiscntUsageService {


    private final PmDiscntUsageMapper mapper;
    private final PmDiscntUsageRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmDiscntUsageDto getById(String id) {
        // pm_discnt_usage :: select one :: id [orm:mybatis]
        PmDiscntUsageDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmDiscntUsageDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_discnt_usage :: select list :: p [orm:mybatis]
        List<PmDiscntUsageDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmDiscntUsageDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_discnt_usage :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmDiscntUsage entity) {
        // pm_discnt_usage :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmDiscntUsage create(PmDiscntUsage entity) {
        entity.setDiscntUsageId(CmUtil.generateId("pm_discnt_usage"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt_usage :: insert or update :: [orm:jpa]
        PmDiscntUsage result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmDiscntUsage save(PmDiscntUsage entity) {
        if (!repository.existsById(entity.getDiscntUsageId()))
            throw new CmBizException("존재하지 않는 PmDiscntUsage입니다: " + entity.getDiscntUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt_usage :: insert or update :: [orm:jpa]
        PmDiscntUsage result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmDiscntUsage입니다: " + id);
        // pm_discnt_usage :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
