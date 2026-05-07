package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.mapper.SyBbmMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbmRepository;
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
public class SyBbmService {


    private final SyBbmMapper syBbmMapper;
    private final SyBbmRepository syBbmRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyBbmDto getById(String id) {
        // sy_bbm :: select one :: id [orm:mybatis]
        SyBbmDto result = syBbmMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyBbmDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_bbm :: select list :: p [orm:mybatis]
        List<SyBbmDto> result = syBbmMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyBbmDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_bbm :: select page :: p [orm:mybatis]
        return PageResult.of(syBbmMapper.selectPageList(p), syBbmMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SyBbm entity) {
        // sy_bbm :: update :: entity [orm:mybatis]
        int result = syBbmMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyBbm create(SyBbm entity) {
        entity.setBbmId(CmUtil.generateId("sy_bbm"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_bbm :: insert or update :: [orm:jpa]
        SyBbm result = syBbmRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SyBbm save(SyBbm entity) {
        if (!syBbmRepository.existsById(entity.getBbmId()))
            throw new CmBizException("존재하지 않는 SyBbm입니다: " + entity.getBbmId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_bbm :: insert or update :: [orm:jpa]
        SyBbm result = syBbmRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyBbm entity = syBbmRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syBbmRepository.delete(entity);
        em.flush();
        if (syBbmRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyBbm> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SyBbm row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setBbmId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_bbm"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syBbmRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getBbmId(), "bbmId must not be null");
                SyBbm entity = syBbmRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "bbmId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                syBbmRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getBbmId(), "bbmId must not be null");
                if (syBbmRepository.existsById(id)) syBbmRepository.deleteById(id);
            }
        }
        em.flush();
    }
}