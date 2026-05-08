package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewRepository;
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
@Transactional(readOnly = true)
public class PdReviewService {


    private final PdReviewMapper pdReviewMapper;
    private final PdReviewRepository pdReviewRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PdReviewDto getById(String id) {
        // pd_review :: select one :: id [orm:mybatis]
        PdReviewDto result = pdReviewMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PdReviewDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_review :: select list :: p [orm:mybatis]
        List<PdReviewDto> result = pdReviewMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PdReviewDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_review :: select page :: [orm:mybatis]
        return PageResult.of(pdReviewMapper.selectPageList(p), pdReviewMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /**
     * 상품별 평점 집계 — FO 상품상세 리뷰 요약(summary) 영역용
     * 반환: { total, avgRating, rate5, rate4, rate3, rate2, rate1 }
     */
    public Map<String, Object> getRatingSummary(String prodId) {
        Map<String, Object> result = pdReviewMapper.selectRatingSummary(prodId);
        return result != null ? result : new java.util.LinkedHashMap<>();
    }

    /** update — 수정 */
    @Transactional
    public int update(PdReview entity) {
        // pd_review :: update :: [orm:mybatis]
        int result = pdReviewMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdReview create(PdReview entity) {
        entity.setReviewId(CmUtil.generateId("pd_review"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review :: insert or update :: [orm:jpa]
        PdReview result = pdReviewRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PdReview save(PdReview entity) {
        if (!pdReviewRepository.existsById(entity.getReviewId()))
            throw new CmBizException("존재하지 않는 PdReview입니다: " + entity.getReviewId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review :: insert or update :: [orm:jpa]
        PdReview result = pdReviewRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pdReviewRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdReview입니다: " + id);
        // pd_review :: delete :: id [orm:jpa]
        pdReviewRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PdReview> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdReview row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setReviewId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_review"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdReviewRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getReviewId(), "reviewId must not be null");
                PdReview entity = pdReviewRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "reviewId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdReviewRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getReviewId(), "reviewId must not be null");
                if (pdReviewRepository.existsById(id)) pdReviewRepository.deleteById(id);
            }
        }
    }
}