package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class CmBlogService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

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
        entity.setBlogId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // cm_blog :: insert or update :: [orm:jpa]
        CmBlog result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmBlog save(CmBlog entity) {
        if (!repository.existsById(entity.getBlogId()))
            throw new CmBizException("존재하지 않는 CmBlog입니다: " + entity.getBlogId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
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

    /** ID 생성: prefix=BL (cm_blog) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "BL" + ts + rand;
    }
}
