package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
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
public class SyRoleService {


    private final SyRoleMapper syRoleMapper;
    private final SyRoleRepository syRoleRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyRoleDto getById(String id) {
        // sy_role :: select one :: id [orm:mybatis]
        SyRoleDto result = syRoleMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_role :: select list :: p [orm:mybatis]
        List<SyRoleDto> result = syRoleMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_role :: select page :: p [orm:mybatis]
        return PageResult.of(syRoleMapper.selectPageList(p), syRoleMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyRole entity) {
        // sy_role :: update :: entity [orm:mybatis]
        int result = syRoleMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyRole create(SyRole entity) {
        entity.setRoleId(CmUtil.generateId("sy_role"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_role :: insert or update :: [orm:jpa]
        SyRole result = syRoleRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyRole save(SyRole entity) {
        if (!syRoleRepository.existsById(entity.getRoleId()))
            throw new CmBizException("존재하지 않는 SyRole입니다: " + entity.getRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_role :: insert or update :: [orm:jpa]
        SyRole result = syRoleRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyRole entity = syRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syRoleRepository.delete(entity);
        em.flush();
        if (syRoleRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyRole row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setRoleId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syRoleRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getRoleId(), "roleId must not be null");
                SyRole entity = syRoleRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "roleId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syRoleRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getRoleId(), "roleId must not be null");
                if (syRoleRepository.existsById(id)) syRoleRepository.deleteById(id);
            }
        }
        em.flush();
    }
}