package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewCommentMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewCommentRepository;
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
public class PdReviewCommentService {

    private final PdReviewCommentMapper pdReviewCommentMapper;
    private final PdReviewCommentRepository pdReviewCommentRepository;

    @PersistenceContext
    private EntityManager em;

    public PdReviewCommentDto.Item getById(String id) {
        PdReviewCommentDto.Item dto = pdReviewCommentMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdReviewComment findById(String id) {
        return pdReviewCommentRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdReviewCommentRepository.existsById(id);
    }

    public List<PdReviewCommentDto.Item> getList(PdReviewCommentDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdReviewCommentMapper.selectList(req);
    }

    public PdReviewCommentDto.PageResponse getPageData(PdReviewCommentDto.Request req) {
        PageHelper.addPaging(req);
        PdReviewCommentDto.PageResponse res = new PdReviewCommentDto.PageResponse();
        List<PdReviewCommentDto.Item> list = pdReviewCommentMapper.selectPageList(req);
        long count = pdReviewCommentMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdReviewComment create(PdReviewComment body) {
        body.setReviewCommentId(CmUtil.generateId("pd_review_comment"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdReviewComment saved = pdReviewCommentRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getReviewCommentId());
    }

    @Transactional
    public PdReviewComment save(PdReviewComment entity) {
        if (!existsById(entity.getReviewCommentId()))
            throw new CmBizException("존재하지 않는 PdReviewComment입니다: " + entity.getReviewCommentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReviewComment saved = pdReviewCommentRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getReviewCommentId());
    }

    @Transactional
    public PdReviewComment update(String id, PdReviewComment body) {
        PdReviewComment entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "reviewCommentId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReviewComment saved = pdReviewCommentRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdReviewComment updatePartial(PdReviewComment entity) {
        if (entity.getReviewCommentId() == null) throw new CmBizException("reviewCommentId 가 필요합니다.");
        if (!existsById(entity.getReviewCommentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getReviewCommentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdReviewCommentMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getReviewCommentId());
    }

    @Transactional
    public void delete(String id) {
        PdReviewComment entity = findById(id);
        pdReviewCommentRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdReviewComment> saveList(List<PdReviewComment> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getReviewCommentId() != null)
            .map(PdReviewComment::getReviewCommentId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdReviewCommentRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdReviewComment> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getReviewCommentId() != null)
            .toList();
        for (PdReviewComment row : updateRows) {
            PdReviewComment entity = findById(row.getReviewCommentId());
            VoUtil.voCopyExclude(row, entity, "reviewCommentId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdReviewCommentRepository.save(entity);
            upsertedIds.add(entity.getReviewCommentId());
        }
        em.flush();

        List<PdReviewComment> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdReviewComment row : insertRows) {
            row.setReviewCommentId(CmUtil.generateId("pd_review_comment"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdReviewCommentRepository.save(row);
            upsertedIds.add(row.getReviewCommentId());
        }
        em.flush();
        em.clear();

        List<PdReviewComment> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
