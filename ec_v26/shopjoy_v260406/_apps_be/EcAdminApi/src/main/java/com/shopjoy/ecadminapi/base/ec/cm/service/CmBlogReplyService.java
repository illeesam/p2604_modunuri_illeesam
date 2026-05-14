package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogReplyDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogReply;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmBlogReplyService {

    private final CmBlogReplyRepository cmBlogReplyRepository;

    @PersistenceContext
    private EntityManager em;

    public CmBlogReplyDto.Item getById(String id) {
        CmBlogReplyDto.Item dto = cmBlogReplyRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogReplyDto.Item getByIdOrNull(String id) {
        return cmBlogReplyRepository.selectById(id).orElse(null);
    }

    public CmBlogReply findById(String id) {
        return cmBlogReplyRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogReply findByIdOrNull(String id) {
        return cmBlogReplyRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return cmBlogReplyRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmBlogReplyRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<CmBlogReplyDto.Item> getList(CmBlogReplyDto.Request req) {
        return cmBlogReplyRepository.selectList(req);
    }

    public CmBlogReplyDto.PageResponse getPageData(CmBlogReplyDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogReplyRepository.selectPageList(req);
    }

    @Transactional
    public CmBlogReply create(CmBlogReply body) {
        body.setCommentId(CmUtil.generateId("cm_blog_reply"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogReply saved = cmBlogReplyRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogReply save(CmBlogReply entity) {
        if (!existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 CmBlogReply입니다: " + entity.getCommentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogReply saved = cmBlogReplyRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
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
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogReply updateSelective(CmBlogReply entity) {
        if (entity.getCommentId() == null) throw new CmBizException("commentId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCommentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCommentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogReplyRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmBlogReply entity = findById(id);
        cmBlogReplyRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
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
