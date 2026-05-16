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
        List<CmBlogDto.Item> list = cmBlogRepository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 */
    public CmBlogDto.PageResponse getPageData(CmBlogDto.Request req) {
        PageHelper.addPaging(req);
        CmBlogDto.PageResponse res = cmBlogRepository.selectPageList(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** getById — 키조회 */
    public CmBlogDto.Item getById(String blogId) {
        CmBlogDto.Item dto = cmBlogRepository.selectById(blogId).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 게시물입니다: " + blogId + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** getByIdAndIncrView — 조회 + viewCount 증가 */
    @Transactional
    public CmBlogDto.Item getByIdAndIncrView(String blogId) {
        CmBlog entity = cmBlogRepository.findById(blogId)
                .orElseThrow(() -> new CmBizException("존재하지 않는 게시물입니다: " + blogId + "::" + CmUtil.svcCallerInfo(this)));
        entity.setViewCount((entity.getViewCount() != null ? entity.getViewCount() : 0) + 1);
        cmBlogRepository.save(entity);
        em.flush();
        CmBlogDto.Item dto = cmBlogRepository.selectById(blogId).orElse(null);
        _itemFillRelations(dto);
        return dto;
    }

    /** _itemFillRelations — 단건 연관조회 (replies/files/tags 채우기) */
    private void _itemFillRelations(CmBlogDto.Item blog) {
        if (blog == null) return;
        String blogId = blog.getBlogId();

        // 하위 댓글 목록 조회 (blogId 기준)
        CmBlogReplyDto.Request rReq = new CmBlogReplyDto.Request();
        rReq.setBlogId(blogId);
        blog.setReplies(cmBlogReplyService.getList(rReq)); // 댓글목록

        // 하위 첨부 목록 조회 (blogId 기준)
        CmBlogFileDto.Request fReq = new CmBlogFileDto.Request();
        fReq.setBlogId(blogId);
        blog.setFiles(cmBlogFileService.getList(fReq)); // 첨부목록

        // 하위 태그 목록 조회 (blogId 기준)
        CmBlogTagDto.Request tReq = new CmBlogTagDto.Request();
        tReq.setBlogId(blogId);
        blog.setTags(cmBlogTagService.getList(tReq)); // 태그목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (replies/files/tags 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 reply 1회 + file 1회 + tag 1회만 조회한다.
     */
    private void _listFillRelations(List<CmBlogDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> blogIds = list.stream()
            .map(CmBlogDto.Item::getBlogId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (blogIds.isEmpty()) return;

        // 댓글 일괄조회 → Map<blogId, List<reply>>
        CmBlogReplyDto.Request rReq = new CmBlogReplyDto.Request();
        rReq.setBlogIds(blogIds);
        Map<String, List<CmBlogReplyDto.Item>> replyMap = cmBlogReplyService.getList(rReq).stream()
            .collect(Collectors.groupingBy(CmBlogReplyDto.Item::getBlogId));

        // 첨부 일괄조회 → Map<blogId, List<file>>
        CmBlogFileDto.Request fReq = new CmBlogFileDto.Request();
        fReq.setBlogIds(blogIds);
        Map<String, List<CmBlogFileDto.Item>> fileMap = cmBlogFileService.getList(fReq).stream()
            .collect(Collectors.groupingBy(CmBlogFileDto.Item::getBlogId));

        // 태그 일괄조회 → Map<blogId, List<tag>>
        CmBlogTagDto.Request tReq = new CmBlogTagDto.Request();
        tReq.setBlogIds(blogIds);
        Map<String, List<CmBlogTagDto.Item>> tagMap = cmBlogTagService.getList(tReq).stream()
            .collect(Collectors.groupingBy(CmBlogTagDto.Item::getBlogId));

        // 각 항목에 분배
        for (CmBlogDto.Item blog : list) {
            String bid = blog.getBlogId();
            blog.setReplies(replyMap.getOrDefault(bid, List.of())); // 댓글목록
            blog.setFiles(fileMap.getOrDefault(bid, List.of()));    // 첨부목록
            blog.setTags(tagMap.getOrDefault(bid, List.of()));      // 태그목록
        }
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
