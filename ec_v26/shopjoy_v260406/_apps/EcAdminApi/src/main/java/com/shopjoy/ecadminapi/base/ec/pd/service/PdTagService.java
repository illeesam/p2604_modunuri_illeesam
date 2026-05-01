package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdTagMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdTagRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdTagService {


    private final PdTagMapper mapper;
    private final PdTagRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdTagDto getById(String id) {
        // pd_tag :: select one :: id [orm:mybatis]
        PdTagDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdTagDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_tag :: select list :: p [orm:mybatis]
        List<PdTagDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdTagDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_tag :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdTag entity) {
        // pd_tag :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdTag create(PdTag entity) {
        entity.setTagId(CmUtil.generateId("pd_tag"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_tag :: insert or update :: [orm:jpa]
        PdTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdTag save(PdTag entity) {
        if (!repository.existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + entity.getTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_tag :: insert or update :: [orm:jpa]
        PdTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + id);
        // pd_tag :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
