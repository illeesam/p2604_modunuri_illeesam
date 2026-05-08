package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.*;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftService;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 상품 서비스 — 사용자 화면용 상품 조회
 * URL: /api/fo/ec/pd/prod
 *
 * base 와 차이:
 *  - 판매중(ON_SALE) 상품만 노출
 *  - siteId 필수 필터링
 *
 * 정책서: pd.10.상품상세-API설계.md §4 — 3계층 분리
 *   Tier 1 — getDetail()      : prod + images + opts + skus (첫 화면 통합)
 *   Tier 2 — getContents()    : 상품설명 (lazy)
 *           getRels()         : 연관상품 (lazy)
 *   Tier 3 — getPromotions()  : 쿠폰/할인/사은품/이벤트 (사용자별 동적)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoPdProdService {

    private final PdProdMapper          pdProdMapper;
    private final PdProdImgService      pdProdImgService;
    private final PdProdOptService      pdProdOptService;
    private final PdProdOptItemService  pdProdOptItemService;
    private final PdProdSkuService      pdProdSkuService;
    private final PdProdContentService  pdProdContentService;
    private final PdProdRelService      pdProdRelService;
    private final PdReviewService       pdReviewService;
    private final PdReviewAttachService pdReviewAttachService;
    private final PdProdQnaService      pdProdQnaService;
    private final PmCouponService       pmCouponService;
    private final PmDiscntService       pmDiscntService;
    private final PmGiftService         pmGiftService;
    private final PmEventService        pmEventService;

    /* ── 목록 ────────────────────────────────────────────────── */

    public List<PdProdDto> getList(Map<String, Object> p) {
        return pdProdMapper.selectList(p);
    }

    /** getPageData — 조회 */
    public PageResult<PdProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pdProdMapper.selectPageList(p), pdProdMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /* ── Tier 1: 첫 화면 통합 (prod + images + opts + skus) ─── */

    public Map<String, Object> getDetail(String prodId) {
        PdProdDto prod = pdProdMapper.selectById(prodId);
        if (prod == null) throw new CmBizException("존재하지 않는 상품입니다: " + prodId);

        Map<String, Object> p = new HashMap<>();
        p.put("prodId", prodId);

        List<PdProdImgDto>     images = pdProdImgService.getList(p);
        List<PdProdOptDto>     groups = pdProdOptService.getList(new HashMap<>(p));
        List<PdProdOptItemDto> items  = pdProdOptItemService.getList(new HashMap<>(p));
        List<PdProdSkuDto>     skus   = pdProdSkuService.getList(new HashMap<>(p));

        Map<String, Object> opts = new LinkedHashMap<>();
        opts.put("groups", groups);
        opts.put("items",  items);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("prod",   prod);
        result.put("images", images);
        result.put("opts",   opts);
        result.put("skus",   skus);
        return result;
    }

    /* ── Tier 2: lazy load ──────────────────────────────────── */

    public List<PdProdContentDto> getContents(String prodId) {
        Map<String, Object> p = new HashMap<>();
        p.put("prodId", prodId);
        return pdProdContentService.getList(p);
    }

    /** getRels — 조회 */
    public List<PdProdRelDto> getRels(String prodId) {
        Map<String, Object> p = new HashMap<>();
        p.put("prodId", prodId);
        return pdProdRelService.getList(p);
    }

    /* ── Tier 2 — 리뷰 / Q&A ─────────────────────────────────── */

    /**
     * 상품별 리뷰 목록 + 평점 집계 요약 + 상단 이미지 모음.
     * 응답: { summary, attachImages, reviewPage: PageResult }
     */
    public Map<String, Object> getReviews(String prodId, Map<String, Object> p) {
        Map<String, Object> param = (p != null) ? new HashMap<>(p) : new HashMap<>();
        param.put("prodId", prodId);
        if (!param.containsKey("status")) param.put("status", "ACTIVE");

        Map<String, Object> result = new LinkedHashMap<>();

        Map<String, Object> summary = pdReviewService.getRatingSummary(prodId);
        result.put("summary", summary != null ? summary : new LinkedHashMap<>());

        Map<String, Object> attachParam = new HashMap<>();
        attachParam.put("prodId", prodId);
        result.put("attachImages", pdReviewAttachService.getList(attachParam));

        PageResult<PdReviewDto> page = pdReviewService.getPageData(param);
        result.put("reviewPage", page);
        return result;
    }

    /**
     * 상품별 리뷰 첨부이미지 전체 — 모아보기 팝업용.
     */
    public List<PdReviewAttachDto> getReviewImages(String prodId) {
        Map<String, Object> p = new HashMap<>();
        p.put("prodId", prodId);
        return pdReviewAttachService.getList(p);
    }

    /**
     * 상품별 Q&A 목록.
     * 응답: { qnaPage: PageResult }
     */
    public Map<String, Object> getQna(String prodId, Map<String, Object> p) {
        Map<String, Object> param = (p != null) ? new HashMap<>(p) : new HashMap<>();
        param.put("prodId", prodId);

        Map<String, Object> result = new LinkedHashMap<>();
        PageResult<PdProdQnaDto> page = pdProdQnaService.getPageData(param);
        result.put("qnaPage", page);
        return result;
    }

    /* ── Tier 3: 프로모션 (통합, 사용자별 동적) ───────────────── */

    /**
     * 상품 적용 가능 프로모션 통합 응답.
     * 응답: { coupons, discnts, gifts, events }
     *
     * 현재 구현 범위:
     *  - coupons: 해당 사이트의 활성 쿠폰 마스터 목록 (issuableYn 등 정밀 매핑은 추후)
     *  - discnts/gifts/events: 활성 마스터 목록 (상품-개별 매핑 정밀도는 *_item 테이블 활용 시 보강)
     *
     * 정밀 매핑 (예: pm_coupon_item.prod_id 로 특정 상품 한정) 은 화면 디자인 확정 후 보강.
     */
    public Map<String, Object> getPromotions(String prodId) {
        PdProdDto prod = pdProdMapper.selectById(prodId);
        Map<String, Object> p = new HashMap<>();
        if (prod != null && prod.getSiteId() != null) {
            p.put("siteId", prod.getSiteId());
        }
        p.put("useYn", "Y");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("coupons", pmCouponService.getList(new HashMap<>(p)));
        result.put("discnts", pmDiscntService.getList(new HashMap<>(p)));
        result.put("gifts",   pmGiftService.getList(new HashMap<>(p)));
        result.put("events",  pmEventService.getList(new HashMap<>(p)));
        return result;
    }
}
