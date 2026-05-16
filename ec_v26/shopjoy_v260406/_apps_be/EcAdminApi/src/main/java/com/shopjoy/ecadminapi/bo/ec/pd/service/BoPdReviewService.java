package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdReviewAttachService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdReviewCommentService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdReviewService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 리뷰 서비스 — base PdReviewService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdReviewService {

    private final PdReviewService pdReviewService;
    private final PdReviewCommentService pdReviewCommentService;
    private final PdReviewAttachService pdReviewAttachService;
    private final PdReviewRepository pdReviewRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public PdReviewDto.Item getById(String id) {
        PdReviewDto.Item dto = pdReviewService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<PdReviewDto.Item> getList(PdReviewDto.Request req) {
        List<PdReviewDto.Item> list = pdReviewService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public PdReviewDto.PageResponse getPageData(PdReviewDto.Request req) {
        PdReviewDto.PageResponse res = pdReviewService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (comments/attaches 채우기) */
    private void _itemFillRelations(PdReviewDto.Item review) {
        if (review == null) return;

        // 하위 리뷰댓글 목록 조회 (reviewId 기준)
        PdReviewCommentDto.Request commentReq = new PdReviewCommentDto.Request();
        commentReq.setReviewId(review.getReviewId());
        review.setComments(pdReviewCommentService.getList(commentReq)); // 댓글목록

        // 하위 리뷰첨부 목록 조회 (reviewId 기준)
        PdReviewAttachDto.Request attachReq = new PdReviewAttachDto.Request();
        attachReq.setReviewId(review.getReviewId());
        review.setAttaches(pdReviewAttachService.getList(attachReq)); // 첨부목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (comments/attaches 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 comment 1회 + attach 1회만 조회한다.
     */
    private void _listFillRelations(List<PdReviewDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> reviewIds = list.stream()
            .map(PdReviewDto.Item::getReviewId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (reviewIds.isEmpty()) return;

        // 리뷰 댓글 전체조회 → Map<reviewId, List<comment>>
        PdReviewCommentDto.Request commentReq = new PdReviewCommentDto.Request();
        commentReq.setReviewIds(reviewIds);
        Map<String, List<PdReviewCommentDto.Item>> commentMap = pdReviewCommentService.getList(commentReq).stream()
            .collect(Collectors.groupingBy(PdReviewCommentDto.Item::getReviewId));

        // 리뷰 첨부 전체조회 → Map<reviewId, List<attach>>
        PdReviewAttachDto.Request attachReq = new PdReviewAttachDto.Request();
        attachReq.setReviewIds(reviewIds);
        Map<String, List<PdReviewAttachDto.Item>> attachMap = pdReviewAttachService.getList(attachReq).stream()
            .collect(Collectors.groupingBy(PdReviewAttachDto.Item::getReviewId));

        // 각 항목에 분배
        for (PdReviewDto.Item review : list) {
            String rid = review.getReviewId();
            review.setComments(commentMap.getOrDefault(rid, List.of())); // 댓글목록
            review.setAttaches(attachMap.getOrDefault(rid, List.of())); // 첨부목록
        }
    }

    @Transactional public PdReview create(PdReview body) { return pdReviewService.create(body); }
    @Transactional public PdReview update(String id, PdReview body) { return pdReviewService.update(id, body); }
    @Transactional public void delete(String id) { pdReviewService.delete(id); }
    @Transactional public void saveList(List<PdReview> rows) { pdReviewService.saveList(rows); }

    /** changeStatus — reviewStatusCd 변경 (이력 보존) */
    @Transactional
    public PdReviewDto.Item changeStatus(String id, String statusCd) {
        PdReview entity = pdReviewRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setReviewStatusCdBefore(entity.getReviewStatusCd());
        entity.setReviewStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReview saved = pdReviewRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return pdReviewService.getById(id);
    }
}
