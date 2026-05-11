package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmBlogReplyMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogReplyRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmBlogReplyService {

    private final CmBlogReplyMapper cmBlogReplyMapper;
    private final CmBlogReplyRepository cmBlogReplyRepository;

    @PersistenceContext
    private EntityManager em;

    public CmBlogReplyDto.Item getById(String id) {
        CmBlogReplyDto.Item dto = cmBlogReplyMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public CmBlogReply findById(String id) {
        return cmBlogReplyRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return cmBlogReplyRepository.existsById(id);
    }

    public List<CmBlogReplyDto.Item> getList(CmBlogReplyDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return cmBlogReplyMapper.selectList(VoUtil.voToMap(req));
    }

    public CmBlogReplyDto.PageResponse getPageData(CmBlogReplyDto.Request req) {
        PageHelper.addPaging(req);
        CmBlogReplyDto.PageResponse res = new CmBlogReplyDto.PageResponse();
        List<CmBlogReplyDto.Item> list = cmBlogReplyMapper.selectPageList(VoUtil.voToMap(req));
        long count = cmBlogReplyMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public CmBlogReply create(CmBlogReply body) {
        body.setCommentId(CmUtil.generateId("cm_blog_reply"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogReply saved = cmBlogReplyRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogReply save(CmBlogReply entity) {
        if (!existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + entity.getCommentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogReply saved = cmBlogReplyRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogReply update(String id, CmBlogReply body) {
        CmBlogReply entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "commentId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogReply saved = cmBlogReplyRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogReply updateSelective(CmBlogReply entity) {
        if (entity.getCommentId() == null) throw new CmBizException("commentId 가 필요합니다.");
        if (!existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCommentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogReplyMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmBlogReply entity = findById(id);
        cmBlogReplyRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<CmBlogReply> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCommentId() != null)
            .map(CmBlogReply::getCommentId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmBlogReplyRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmBlogReply> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCommentId() != null)
            .toList();
        for (CmBlogReply row : updateRows) {
            CmBlogReply entity = findById(row.getCommentId());
            VoUtil.voCopyExclude(row, entity, "commentId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmBlogReplyRepository.save(entity);
        }
        em.flush();

        List<CmBlogReply> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlogReply row : insertRows) {
            row.setCommentId(CmUtil.generateId("cm_blog_reply"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmBlogReplyRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
