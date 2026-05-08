package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserRoleMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRoleRepository;
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
public class SyUserRoleService {


    private final SyUserRoleMapper syUserRoleMapper;
    private final SyUserRoleRepository syUserRoleRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyUserRoleDto getById(String id) {
        // sy_user_role :: select one :: id [orm:mybatis]
        SyUserRoleDto result = syUserRoleMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyUserRoleDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_user_role :: select list :: p [orm:mybatis]
        List<SyUserRoleDto> result = syUserRoleMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyUserRoleDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_user_role :: select page :: p [orm:mybatis]
        return PageResult.of(syUserRoleMapper.selectPageList(p), syUserRoleMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyUserRole entity) {
        // sy_user_role :: update :: entity [orm:mybatis]
        int result = syUserRoleMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyUserRole create(SyUserRole entity) {
        entity.setUserRoleId(CmUtil.generateId("sy_user_role"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_user_role :: insert or update :: [orm:jpa]
        SyUserRole result = syUserRoleRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyUserRole save(SyUserRole entity) {
        if (!syUserRoleRepository.existsById(entity.getUserRoleId()))
            throw new CmBizException("존재하지 않는 SyUserRole입니다: " + entity.getUserRoleId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_user_role :: insert or update :: [orm:jpa]
        SyUserRole result = syUserRoleRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyUserRole entity = syUserRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syUserRoleRepository.delete(entity);
        em.flush();
        if (syUserRoleRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyUserRole> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyUserRole row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setUserRoleId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_user_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syUserRoleRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getUserRoleId(), "userRoleId must not be null");
                SyUserRole entity = syUserRoleRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "userRoleId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syUserRoleRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getUserRoleId(), "userRoleId must not be null");
                if (syUserRoleRepository.existsById(id)) syUserRoleRepository.deleteById(id);
            }
        }
        em.flush();
    }
}