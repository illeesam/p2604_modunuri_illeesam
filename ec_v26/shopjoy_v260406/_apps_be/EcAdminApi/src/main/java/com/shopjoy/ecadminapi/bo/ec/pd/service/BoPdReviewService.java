package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewRepository;
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
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 리뷰 서비스 — base PdReviewService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdReviewService {

    private final PdReviewService pdReviewService;
    private final PdReviewRepository pdReviewRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public PdReviewDto.Item getById(String id) { return pdReviewService.getById(id); }
    /* 목록조회 */
    public List<PdReviewDto.Item> getList(PdReviewDto.Request req) { return pdReviewService.getList(req); }
    /* 페이지조회 */
    public PdReviewDto.PageResponse getPageData(PdReviewDto.Request req) { return pdReviewService.getPageData(req); }

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
