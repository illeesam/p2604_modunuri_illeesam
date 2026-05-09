package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMenuMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleMenuRepository;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyRoleMenuService {

    private final SyRoleMenuMapper syRoleMenuMapper;
    private final SyRoleMenuRepository syRoleMenuRepository;
    private final SyRoleMenuRedisStore roleMenuCache;

    @PersistenceContext
    private EntityManager em;

    public SyRoleMenuDto.Item getById(String id) {
        SyRoleMenuDto.Item dto = syRoleMenuMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyRoleMenu findById(String id) {
        return syRoleMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syRoleMenuRepository.existsById(id);
    }

    public List<SyRoleMenuDto.Item> getList(SyRoleMenuDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syRoleMenuMapper.selectList(req);
    }

    public SyRoleMenuDto.PageResponse getPageData(SyRoleMenuDto.Request req) {
        PageHelper.addPaging(req);
        SyRoleMenuDto.PageResponse res = new SyRoleMenuDto.PageResponse();
        List<SyRoleMenuDto.Item> list = syRoleMenuMapper.selectPageList(req);
        long count = syRoleMenuMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyRoleMenu create(SyRoleMenu body) {
        body.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        roleMenuCache.evict(body.getRoleId());
        return saved;
    }

    @Transactional
    public SyRoleMenu save(SyRoleMenu entity) {
        if (!existsById(entity.getRoleMenuId()))
            throw new CmBizException("존재하지 않는 SyRoleMenu입니다: " + entity.getRoleMenuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        roleMenuCache.evict(entity.getRoleId());
        return saved;
    }

    @Transactional
    public SyRoleMenu update(String id, SyRoleMenu body) {
        SyRoleMenu entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "roleMenuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        roleMenuCache.evict(entity.getRoleId());
        return saved;
    }

    @Transactional
    public SyRoleMenu updatePartial(SyRoleMenu entity) {
        if (entity.getRoleMenuId() == null) throw new CmBizException("roleMenuId 가 필요합니다.");
        if (!existsById(entity.getRoleMenuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRoleMenuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syRoleMenuMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        if (entity.getRoleId() != null) roleMenuCache.evict(entity.getRoleId());
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyRoleMenu entity = findById(id);
        String roleId = entity.getRoleId();
        syRoleMenuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
        if (roleId != null) roleMenuCache.evict(roleId);
    }

    @Transactional
    public void saveList(List<SyRoleMenu> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRoleMenuId() != null)
            .map(SyRoleMenu::getRoleMenuId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syRoleMenuRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyRoleMenu> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRoleMenuId() != null)
            .toList();
        for (SyRoleMenu row : updateRows) {
            SyRoleMenu entity = findById(row.getRoleMenuId());
            VoUtil.voCopyExclude(row, entity, "roleMenuId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syRoleMenuRepository.save(entity);
        }
        em.flush();

        List<SyRoleMenu> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyRoleMenu row : insertRows) {
            row.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syRoleMenuRepository.save(row);
        }
        em.flush();
        em.clear();

        // 영향 받은 모든 roleId의 캐시 evict
        rows.stream()
            .map(SyRoleMenu::getRoleId)
            .filter(java.util.Objects::nonNull)
            .distinct()
            .forEach(roleMenuCache::evict);
    }
}
