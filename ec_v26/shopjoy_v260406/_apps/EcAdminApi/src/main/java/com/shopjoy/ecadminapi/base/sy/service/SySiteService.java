package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.mapper.SySiteMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
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
public class SySiteService {


    private final SySiteMapper sySiteMapper;
    private final SySiteRepository sySiteRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public SySiteDto getById(String id) {
        // sy_site :: select one :: id [orm:mybatis]
        SySiteDto result = sySiteMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<SySiteDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_site :: select list :: p [orm:mybatis]
        List<SySiteDto> result = sySiteMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<SySiteDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_site :: select page :: p [orm:mybatis]
        return PageResult.of(sySiteMapper.selectPageList(p), sySiteMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(SySite entity) {
        // sy_site :: update :: entity [orm:mybatis]
        int result = sySiteMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SySite create(SySite entity) {
        entity.setSiteId(CmUtil.generateId("sy_site"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_site :: insert or update :: [orm:jpa]
        SySite result = sySiteRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public SySite save(SySite entity) {
        if (!sySiteRepository.existsById(entity.getSiteId()))
            throw new CmBizException("존재하지 않는 SySite입니다: " + entity.getSiteId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_site :: insert or update :: [orm:jpa]
        SySite result = sySiteRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SySite entity = sySiteRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        sySiteRepository.delete(entity);
        em.flush();
        if (sySiteRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SySite> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (SySite row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSiteId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("sy_site"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                sySiteRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSiteId(), "siteId must not be null");
                SySite entity = sySiteRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "siteId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                sySiteRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSiteId(), "siteId must not be null");
                if (sySiteRepository.existsById(id)) sySiteRepository.deleteById(id);
            }
        }
        em.flush();
    }
}