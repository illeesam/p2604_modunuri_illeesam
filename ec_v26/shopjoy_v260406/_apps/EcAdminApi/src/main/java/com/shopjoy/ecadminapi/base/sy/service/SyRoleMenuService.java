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
@Transactional(readOnly = true)
public class SyRoleMenuService {


    private final SyRoleMenuMapper      syRoleMenuMapper;
    private final SyRoleMenuRepository  syRoleMenuRepository;
    private final SyRoleMenuRedisStore  roleMenuCache;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyRoleMenuDto getById(String id) {
        // sy_role_menu :: select one :: id [orm:mybatis]
        SyRoleMenuDto result = syRoleMenuMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyRoleMenuDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_role_menu :: select list :: p [orm:mybatis]
        List<SyRoleMenuDto> result = syRoleMenuMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyRoleMenuDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_role_menu :: select page :: p [orm:mybatis]
        return PageResult.of(syRoleMenuMapper.selectPageList(p), syRoleMenuMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyRoleMenu entity) {
        // sy_role_menu :: update :: entity [orm:mybatis]
        int result = syRoleMenuMapper.updateSelective(entity);
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
        SyRoleMenu result = syRoleMenuRepository.save(entity);
        roleMenuCache.evict(entity.getRoleId());
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyRoleMenu save(SyRoleMenu entity) {
        if (!syRoleMenuRepository.existsById(entity.getRoleMenuId()))
            throw new CmBizException("존재하지 않는 SyRoleMenu입니다: " + entity.getRoleMenuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_role_menu :: insert or update :: [orm:jpa]
        SyRoleMenu result = syRoleMenuRepository.save(entity);
        roleMenuCache.evict(entity.getRoleId());
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyRoleMenu entity = syRoleMenuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syRoleMenuRepository.delete(entity);
        em.flush();
        if (syRoleMenuRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
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
                syRoleMenuRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getRoleMenuId(), "roleMenuId must not be null");
                SyRoleMenu entity = syRoleMenuRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "roleMenuId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syRoleMenuRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getRoleMenuId(), "roleMenuId must not be null");
                if (syRoleMenuRepository.existsById(id)) syRoleMenuRepository.deleteById(id);
            }
        }
        em.flush();
    }
}