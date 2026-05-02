package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleMenuRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
public class SyRoleMenuService {


    private final SyRoleMenuMapper      mapper;
    private final SyRoleMenuRepository  repository;
    private final SyRoleMenuRedisStore  roleMenuCache;

    @PersistenceContext
    private EntityManager em;

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
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
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
        SyRoleMenu entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<SyRoleMenu> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyRoleMenu row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setRoleMenuId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_role_menu"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getRoleMenuId(), "roleMenuId must not be null");
                SyRoleMenu entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "roleMenuId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getRoleMenuId(), "roleMenuId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
        em.flush();
    }
}