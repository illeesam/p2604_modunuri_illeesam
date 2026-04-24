package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleMenuRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
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
public class SyRoleMenuService {


    private final SyRoleMenuMapper      mapper;
    private final SyRoleMenuRepository  repository;
    private final SyRoleMenuRedisStore  roleMenuCache;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyRoleMenuDto getById(String id) {
        // sy_role_menu :: select one :: id [orm:mybatis]
        SyRoleMenuDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyRoleMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_role_menu :: select list :: p [orm:mybatis]
        List<SyRoleMenuDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyRoleMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_role_menu :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyRoleMenu entity) {
        // sy_role_menu :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        roleMenuCache.evict(entity.getRoleId());
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyRoleMenu create(SyRoleMenu entity) {
        entity.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // sy_role_menu :: insert or update :: [orm:jpa]
        SyRoleMenu result = repository.save(entity);
        roleMenuCache.evict(entity.getRoleId());
        return result;
    }

    @Transactional
    public SyRoleMenu save(SyRoleMenu entity) {
        if (!repository.existsById(entity.getRoleMenuId()))
            throw new CmBizException("존재하지 않는 SyRoleMenu입니다: " + entity.getRoleMenuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_role_menu :: insert or update :: [orm:jpa]
        SyRoleMenu result = repository.save(entity);
        roleMenuCache.evict(entity.getRoleId());
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyRoleMenu입니다: " + id);
        // sy_role_menu :: delete :: id [orm:jpa]
        repository.deleteById(id);
        roleMenuCache.evictAll();  // roleId 조회 없이 전체 무효화
    }

}
