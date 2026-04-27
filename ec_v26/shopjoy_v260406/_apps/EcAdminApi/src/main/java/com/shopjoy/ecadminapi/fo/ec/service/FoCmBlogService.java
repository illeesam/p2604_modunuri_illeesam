package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

/**
 * FO 게시물(블로그/FAQ/공지) 서비스
 * URL: /api/fo/ec/cm/bltn
 *
 * - 블로그 목록/상세: blogCateId 필터링
 * - FAQ: blogCateId 또는 kw 검색
 * - 상세 조회 시 viewCount 자동 증가
 */
@Service
@RequiredArgsConstructor
public class FoCmBlogService {


    private final CmBlogMapper     mapper;
    private final CmBlogRepository repository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<CmBlogDto> getList(Map<String, Object> p) {
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<CmBlogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public CmBlogDto getByIdAndIncrView(String blogId) {
        CmBlog entity = repository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId));
        entity.setViewCount((entity.getViewCount() != null ? entity.getViewCount() : 0) + 1);
        repository.save(entity);
        em.flush();
        return mapper.selectById(blogId);
    }

    @Transactional
    public CmBlog create(CmBlog entity) {
        entity.setBlogId(CmUtil.generateId("cm_blog"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        if (entity.getUseYn() == null) entity.setUseYn("Y");
        if (entity.getViewCount() == null) entity.setViewCount(0);
        CmBlog saved = repository.save(entity);
        if (saved == null) throw new CmBizException("게시물 작성에 실패했습니다.");
        return saved;
    }

    @Transactional
    public CmBlog update(String blogId, CmBlog entity) {
        CmBlog existing = repository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId));
        if (!existing.getRegBy().equals(SecurityUtil.getAuthUser().authId()) && !SecurityUtil.isBo())
            throw new CmBizException("수정 권한이 없습니다.");
        entity.setBlogId(blogId);
        entity.setRegBy(existing.getRegBy());
        entity.setRegDate(existing.getRegDate());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlog saved = repository.save(entity);
        if (saved == null) throw new CmBizException("게시물 수정에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public void delete(String blogId) {
        CmBlog existing = repository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId));
        if (!existing.getRegBy().equals(SecurityUtil.getAuthUser().authId()) && !SecurityUtil.isBo())
            throw new CmBizException("삭제 권한이 없습니다.");
        repository.deleteById(blogId);
        em.flush();
    }

}
