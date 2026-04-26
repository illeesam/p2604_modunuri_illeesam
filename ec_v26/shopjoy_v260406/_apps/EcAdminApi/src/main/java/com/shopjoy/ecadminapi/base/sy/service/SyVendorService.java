package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.mapper.SyVendorMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
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
public class SyVendorService {


    private final SyVendorMapper mapper;
    private final SyVendorRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyVendorDto getById(String id) {
        // sy_vendor :: select one :: id [orm:mybatis]
        SyVendorDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyVendorDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_vendor :: select list :: p [orm:mybatis]
        List<SyVendorDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyVendorDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_vendor :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyVendor entity) {
        // sy_vendor :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyVendor create(SyVendor entity) {
        entity.setVendorId(CmUtil.generateId("sy_vendor"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor :: insert or update :: [orm:jpa]
        SyVendor result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyVendor save(SyVendor entity) {
        if (!repository.existsById(entity.getVendorId()))
            throw new CmBizException("존재하지 않는 SyVendor입니다: " + entity.getVendorId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_vendor :: insert or update :: [orm:jpa]
        SyVendor result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyVendor입니다: " + id);
        // sy_vendor :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
