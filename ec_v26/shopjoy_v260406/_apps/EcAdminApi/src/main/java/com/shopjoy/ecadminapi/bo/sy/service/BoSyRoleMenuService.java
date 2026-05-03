package com.shopjoy.ecadminapi.bo.sy.service;

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
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyRoleMenuService {

    private final SyRoleMenuMapper     mapper;
    private final SyRoleMenuRepository repository;
    private final SyRoleMenuRedisStore roleMenuCache;

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<SyRoleMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyRoleMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyRoleMenuDto getById(String id) {
        SyRoleMenuDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public SyRoleMenu create(SyRoleMenu body) {
        body.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = repository.save(body);
        evictIfPresent(saved.getRoleId());
        return saved;
    }

    @Transactional
    public SyRoleMenuDto update(String id, SyRoleMenu body) {
        SyRoleMenu entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        if (body.getRoleId()    != null) entity.setRoleId(body.getRoleId());
        if (body.getMenuId()    != null) entity.setMenuId(body.getMenuId());
        if (body.getPermLevel() != null) entity.setPermLevel(body.getPermLevel());
        if (body.getSiteId()    != null) entity.setSiteId(body.getSiteId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        repository.save(entity);
        em.flush();
        evictIfPresent(entity.getRoleId());
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        SyRoleMenu entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        String roleId = entity.getRoleId();
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
        evictIfPresent(roleId);
    }

    private void evictIfPresent(String roleId) {
        if (roleId != null) roleMenuCache.evict(roleId);
    }
    @Transactional
    public void saveList(List<SyRoleMenu> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRoleMenuId() != null)
            .map(SyRoleMenu::getRoleMenuId)
            .toList();
        if (!deleteIds.isEmpty()) {
            repository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (SyRoleMenu row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getRoleMenuId(), "RoleMenuId must not be null");
            SyRoleMenu entity = repository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "roleMenuId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            repository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (SyRoleMenu row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setRoleMenuId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_role_menu"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            repository.save(row);
        }
        em.flush();
        em.clear();
        rows.stream().map(SyRoleMenu::getRoleMenuId).filter(java.util.Objects::nonNull).forEach(id -> evictIfPresent(id));
    }
}