package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRoleRepository;
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
public class SyUserRoleService {


    private final SyUserRoleMapper mapper;
    private final SyUserRoleRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyUserRoleDto getById(String id) {
        // sy_user_role :: select one :: id [orm:mybatis]
        SyUserRoleDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyUserRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_user_role :: select list :: p [orm:mybatis]
        List<SyUserRoleDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyUserRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_user_role :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyUserRole entity) {
        // sy_user_role :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyUserRole create(SyUserRole entity) {
        entity.setUserRoleId(CmUtil.generateId("sy_user_role"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // sy_user_role :: insert or update :: [orm:jpa]
        SyUserRole result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyUserRole save(SyUserRole entity) {
        if (!repository.existsById(entity.getUserRoleId()))
            throw new CmBizException("존재하지 않는 SyUserRole입니다: " + entity.getUserRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_user_role :: insert or update :: [orm:jpa]
        SyUserRole result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyUserRole입니다: " + id);
        // sy_user_role :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
