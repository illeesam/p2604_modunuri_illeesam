package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
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
public class CmBlogService {

    private final CmBlogMapper mapper;
    private final CmBlogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogDto getById(String id) {
        // cm_blog :: select one :: id [orm:mybatis]
        CmBlogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmBlogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog :: select list :: p [orm:mybatis]
        List<CmBlogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmBlog entity) {
        // cm_blog :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlog create(CmBlog entity) {
        entity.setBlogId(CmUtil.generateId("cm_blog"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog :: insert or update :: [orm:jpa]
        CmBlog result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBlog save(CmBlog entity) {
        if (!repository.existsById(entity.getBlogId()))
            throw new CmBizException("존재하지 않는 CmBlog입니다: " + entity.getBlogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog :: insert or update :: [orm:jpa]
        CmBlog result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBlog입니다: " + id);
        // cm_blog :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
