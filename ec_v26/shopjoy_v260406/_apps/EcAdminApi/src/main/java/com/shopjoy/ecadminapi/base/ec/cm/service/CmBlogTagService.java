package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogTag;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogTagMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogTagRepository;
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
public class CmBlogTagService {

    private final CmBlogTagMapper mapper;
    private final CmBlogTagRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogTagDto getById(String id) {
        // cm_blog_tag :: select one :: id [orm:mybatis]
        CmBlogTagDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBlogTagDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog_tag :: select list :: p [orm:mybatis]
        List<CmBlogTagDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogTagDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog_tag :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmBlogTag entity) {
        // cm_blog_tag :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogTag create(CmBlogTag entity) {
        entity.setBlogTagId(CmUtil.generateId("cm_blog_tag"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_tag :: insert or update :: [orm:jpa]
        CmBlogTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBlogTag save(CmBlogTag entity) {
        if (!repository.existsById(entity.getBlogTagId()))
            throw new CmBizException("존재하지 않는 CmBlogTag입니다: " + entity.getBlogTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_tag :: insert or update :: [orm:jpa]
        CmBlogTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBlogTag입니다: " + id);
        // cm_blog_tag :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
