package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
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
public class SyUserService {


    private final SyUserMapper syUserMapper;
    private final SyUserRepository syUserRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SyUserDto getById(String id) {
        // sy_user :: select one :: id [orm:mybatis]
        SyUserDto result = syUserMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SyUserDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_user :: select list :: p [orm:mybatis]
        List<SyUserDto> result = syUserMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SyUserDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_user :: select page :: p [orm:mybatis]
        return PageResult.of(syUserMapper.selectPageList(p), syUserMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyUser entity) {
        // sy_user :: update :: entity [orm:mybatis]
        int result = syUserMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyUser create(SyUser entity) {
        entity.setUserId(CmUtil.generateId("sy_user"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_user :: insert or update :: [orm:jpa]
        SyUser result = syUserRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyUser save(SyUser entity) {
        if (!syUserRepository.existsById(entity.getUserId()))
            throw new CmBizException("존재하지 않는 SyUser입니다: " + entity.getUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_user :: insert or update :: [orm:jpa]
        SyUser result = syUserRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyUser entity = syUserRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syUserRepository.delete(entity);
        em.flush();
        if (syUserRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyUser> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyUser row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setUserId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_user"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syUserRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getUserId(), "userId must not be null");
                SyUser entity = syUserRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "userId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syUserRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getUserId(), "userId must not be null");
                if (syUserRepository.existsById(id)) syUserRepository.deleteById(id);
            }
        }
        em.flush();
    }
}