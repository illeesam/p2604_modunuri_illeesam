package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogReplyMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogReplyRepository;
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
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class CmBlogReplyService {

    private final CmBlogReplyMapper cmBlogReplyMapper;
    private final CmBlogReplyRepository cmBlogReplyRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmBlogReplyDto getById(String id) {
        // cm_blog_reply :: select one :: id [orm:mybatis]
        CmBlogReplyDto result = cmBlogReplyMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<CmBlogReplyDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_blog_reply :: select list :: p [orm:mybatis]
        List<CmBlogReplyDto> result = cmBlogReplyMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<CmBlogReplyDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_blog_reply :: select page :: [orm:mybatis]
        return PageResult.of(cmBlogReplyMapper.selectPageList(p), cmBlogReplyMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(CmBlogReply entity) {
        // cm_blog_reply :: update :: [orm:mybatis]
        int result = cmBlogReplyMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmBlogReply create(CmBlogReply entity) {
        entity.setCommentId(CmUtil.generateId("cm_blog_reply"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_reply :: insert or update :: [orm:jpa]
        CmBlogReply result = cmBlogReplyRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public CmBlogReply save(CmBlogReply entity) {
        if (!cmBlogReplyRepository.existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + entity.getCommentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_blog_reply :: insert or update :: [orm:jpa]
        CmBlogReply result = cmBlogReplyRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!cmBlogReplyRepository.existsById(id))
            throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + id);
        // cm_blog_reply :: delete :: id [orm:jpa]
        cmBlogReplyRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<CmBlogReply> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (CmBlogReply row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCommentId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("cm_blog_reply"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmBlogReplyRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCommentId(), "commentId must not be null");
                CmBlogReply entity = cmBlogReplyRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "commentId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                cmBlogReplyRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCommentId(), "commentId must not be null");
                if (cmBlogReplyRepository.existsById(id)) cmBlogReplyRepository.deleteById(id);
            }
        }
    }
}