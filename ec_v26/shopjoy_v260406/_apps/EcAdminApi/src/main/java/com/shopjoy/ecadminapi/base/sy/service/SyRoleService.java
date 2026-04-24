package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
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
public class SyRoleService {


    private final SyRoleMapper mapper;
    private final SyRoleRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyRoleDto getById(String id) {
        // sy_role :: select one :: id [orm:mybatis]
        SyRoleDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_role :: select list :: p [orm:mybatis]
        List<SyRoleDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_role :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyRole entity) {
        // sy_role :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyRole create(SyRole entity) {
        entity.setRoleId(CmUtil.generateId("sy_role"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // sy_role :: insert or update :: [orm:jpa]
        SyRole result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyRole save(SyRole entity) {
        if (!repository.existsById(entity.getRoleId()))
            throw new CmBizException("존재하지 않는 SyRole입니다: " + entity.getRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_role :: insert or update :: [orm:jpa]
        SyRole result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyRole입니다: " + id);
        // sy_role :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
