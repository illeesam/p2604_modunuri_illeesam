package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.mapper.SySiteMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class SySiteService {


    private final SySiteMapper mapper;
    private final SySiteRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SySiteDto getById(String id) {
        // sy_site :: select one :: id [orm:mybatis]
        SySiteDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SySiteDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_site :: select list :: p [orm:mybatis]
        List<SySiteDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SySiteDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_site :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SySite entity) {
        // sy_site :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
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
        SySite result = repository.save(entity);
        return result;
    }

    @Transactional
    public SySite save(SySite entity) {
        if (!repository.existsById(entity.getSiteId()))
            throw new CmBizException("존재하지 않는 SySite입니다: " + entity.getSiteId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_site :: insert or update :: [orm:jpa]
        SySite result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SySite entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
