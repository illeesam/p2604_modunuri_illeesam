package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyRoleMenuService {

    private final SyRoleMenuRepository syRoleMenuRepository;
    private final SyRoleMenuRedisStore roleMenuCache;

    @PersistenceContext
    private EntityManager em;

    /* 역할별 메뉴 권한 키조회 */
    public SyRoleMenuDto.Item getById(String id) {
        SyRoleMenuDto.Item dto = syRoleMenuRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRoleMenuDto.Item getByIdOrNull(String id) {
        return syRoleMenuRepository.selectById(id).orElse(null);
    }

    /* 역할별 메뉴 권한 상세조회 */
    public SyRoleMenu findById(String id) {
        return syRoleMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyRoleMenu findByIdOrNull(String id) {
        return syRoleMenuRepository.findById(id).orElse(null);
    }

    /* 역할별 메뉴 권한 키검증 */
    public boolean existsById(String id) {
        return syRoleMenuRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syRoleMenuRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 역할별 메뉴 권한 목록조회 */
    public List<SyRoleMenuDto.Item> getList(SyRoleMenuDto.Request req) {
        return syRoleMenuRepository.selectList(req);
    }

    /* 역할별 메뉴 권한 페이지조회 */
    public SyRoleMenuDto.PageResponse getPageData(SyRoleMenuDto.Request req) {
        PageHelper.addPaging(req);
        return syRoleMenuRepository.selectPageList(req);
    }

    /* 역할별 메뉴 권한 등록 */
    @Transactional
    public SyRoleMenu create(SyRoleMenu body) {
        body.setRoleMenuId(CmUtil.generateId("sy_role_menu"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        roleMenuCache.evict(body.getRoleId());
        return saved;
    }

    /* 역할별 메뉴 권한 저장 */
    @Transactional
    public SyRoleMenu save(SyRoleMenu entity) {
        if (!existsById(entity.getRoleMenuId()))
            throw new CmBizException("존재하지 않는 SyRoleMenu입니다: " + entity.getRoleMenuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        roleMenuCache.evict(entity.getRoleId());
        return saved;
    }

    /* 역할별 메뉴 권한 수정 */
    @Transactional
    public SyRoleMenu update(String id, SyRoleMenu body) {
        SyRoleMenu entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "roleMenuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyRoleMenu saved = syRoleMenuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        roleMenuCache.evict(entity.getRoleId());
        return saved;
    }

    /* 역할별 메뉴 권한 수정 */
    @Transactional
    public SyRoleMenu updateSelective(SyRoleMenu entity) {
        if (entity.getRoleMenuId() == null) throw new CmBizException("roleMenuId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getRoleMenuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRoleMenuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syRoleMenuRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        if (entity.getRoleId() != null) roleMenuCache.evict(entity.getRoleId());
        return entity;
    }

    /* 역할별 메뉴 권한 삭제 */
    @Transactional
    public void delete(String id) {
        SyRoleMenu entity = findById(id);
        String roleId = entity.getRoleId();
        syRoleMenuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        if (roleId != null) roleMenuCache.evict(roleId);
    }

    /* 역할별 메뉴 권한 목록저장 */
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
