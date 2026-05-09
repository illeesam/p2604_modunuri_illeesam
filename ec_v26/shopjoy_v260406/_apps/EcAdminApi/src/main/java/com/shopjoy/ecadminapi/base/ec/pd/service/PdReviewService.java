package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewRepository;
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
public class PdReviewService {

    private final PdReviewMapper pdReviewMapper;
    private final PdReviewRepository pdReviewRepository;

    @PersistenceContext
    private EntityManager em;

    public PdReviewDto.Item getById(String id) {
        PdReviewDto.Item dto = pdReviewMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdReview findById(String id) {
        return pdReviewRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdReviewRepository.existsById(id);
    }

    public List<PdReviewDto.Item> getList(PdReviewDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdReviewMapper.selectList(req);
    }

    public PdReviewDto.PageResponse getPageData(PdReviewDto.Request req) {
        PageHelper.addPaging(req);
        PdReviewDto.PageResponse res = new PdReviewDto.PageResponse();
        List<PdReviewDto.Item> list = pdReviewMapper.selectPageList(req);
        long count = pdReviewMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdReview create(PdReview body) {
        body.setReviewId(CmUtil.generateId("pd_review"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdReview saved = pdReviewRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getReviewId());
    }

    @Transactional
    public PdReview save(PdReview entity) {
        if (!existsById(entity.getReviewId()))
            throw new CmBizException("존재하지 않는 PdReview입니다: " + entity.getReviewId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReview saved = pdReviewRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getReviewId());
    }

    @Transactional
    public PdReview update(String id, PdReview body) {
        PdReview entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "reviewId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReview saved = pdReviewRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdReview updatePartial(PdReview entity) {
        if (entity.getReviewId() == null) throw new CmBizException("reviewId 가 필요합니다.");
        if (!existsById(entity.getReviewId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getReviewId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdReviewMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getReviewId());
    }

    @Transactional
    public void delete(String id) {
        PdReview entity = findById(id);
        pdReviewRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdReview> saveList(List<PdReview> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getReviewId() != null)
            .map(PdReview::getReviewId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdReviewRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdReview> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getReviewId() != null)
            .toList();
        for (PdReview row : updateRows) {
            PdReview entity = findById(row.getReviewId());
            VoUtil.voCopyExclude(row, entity, "reviewId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdReviewRepository.save(entity);
            upsertedIds.add(entity.getReviewId());
        }
        em.flush();

        List<PdReview> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdReview row : insertRows) {
            row.setReviewId(CmUtil.generateId("pd_review"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdReviewRepository.save(row);
            upsertedIds.add(row.getReviewId());
        }
        em.flush();
        em.clear();

        List<PdReview> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
