package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogTagDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogRepository;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogReplyService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogFileService;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmBlogTagService;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
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
import java.util.stream.Collectors;

/**
 * FO 게시물(블로그/FAQ/공지) 서비스
 * URL: /api/fo/ec/cm/bltn
 *
 * - 블로그 목록/상세: blogCateId 필터링
 * - FAQ: blogCateId 또는 검색
 * - 상세 조회 시 viewCount 자동 증가
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoCmBlogService {

    private final CmBlogRepository cmBlogRepository;
    private final CmBlogReplyService cmBlogReplyService;
    private final CmBlogFileService cmBlogFileService;
    private final CmBlogTagService cmBlogTagService;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    public List<CmBlogDto.Item> getList(CmBlogDto.Request req) {
        return cmBlogRepository.selectList(req);
    }

    /** getPageData — 조회 */
    public CmBlogDto.PageResponse getPageData(CmBlogDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogRepository.selectPageList(req);
    }

    /** getByIdAndIncrView — 조회 + viewCount 증가 */
    @Transactional
    public CmBlogDto.Item getByIdAndIncrView(String blogId) {
        CmBlog entity = cmBlogRepository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId + "::" + CmUtil.svcCallerInfo(this)));
        entity.setViewCount((entity.getViewCount() != null ? entity.getViewCount() : 0) + 1);
        cmBlogRepository.save(entity);
        em.flush();
        return cmBlogRepository.selectById(blogId).orElse(null);
    }

    /** create — 생성 */
    @Transactional
    public CmBlog create(CmBlog entity) {
        entity.setBlogId(CmUtil.generateId("cm_blog"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        if (entity.getUseYn() == null) entity.setUseYn("Y");
        if (entity.getViewCount() == null) entity.setViewCount(0);
        CmBlog saved = cmBlogRepository.save(entity);
        if (saved == null) throw new CmBizException("게시물 작성에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public CmBlog update(String blogId, CmBlog entity) {
        CmBlog existing = cmBlogRepository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId + "::" + CmUtil.svcCallerInfo(this)));
        if (!existing.getRegBy().equals(SecurityUtil.getAuthUser().authId()) && !SecurityUtil.isBo())
            throw new CmBizException("수정 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        entity.setBlogId(blogId);
        entity.setRegBy(existing.getRegBy());
        entity.setRegDate(existing.getRegDate());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlog saved = cmBlogRepository.save(entity);
        if (saved == null) throw new CmBizException("게시물 수정에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String blogId) {
        CmBlog existing = cmBlogRepository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId + "::" + CmUtil.svcCallerInfo(this)));
        if (!existing.getRegBy().equals(SecurityUtil.getAuthUser().authId()) && !SecurityUtil.isBo())
            throw new CmBizException("삭제 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        cmBlogRepository.deleteById(blogId);
        em.flush();
    }
}
