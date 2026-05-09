package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.*;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
    private final PdProdService         pdProdService;
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

    public List<PdProdDto.Item> getList(PdProdDto.Request req) {
        return pdProdMapper.selectList(req);
    }

    /** getPageData — 조회 */
    public PdProdDto.PageResponse getPageData(PdProdDto.Request req) {
        return pdProdService.getPageData(req);
    }

    /* ── Tier 1: 첫 화면 통합 (prod + images + opts + skus) ─── */

    public Map<String, Object> getDetail(String prodId) {
        PdProdDto.Item prod = pdProdMapper.selectById(prodId);
        if (prod == null) throw new CmBizException("존재하지 않는 상품입니다: " + prodId);

        PdProdImgDto.Request     imgReq  = new PdProdImgDto.Request();
        imgReq.setProdId(prodId);
        PdProdOptDto.Request     optReq  = new PdProdOptDto.Request();
        optReq.setProdId(prodId);
        PdProdOptItemDto.Request itemReq = new PdProdOptItemDto.Request();
        itemReq.setProdId(prodId);
        PdProdSkuDto.Request     skuReq  = new PdProdSkuDto.Request();
        skuReq.setProdId(prodId);

        List<PdProdImgDto.Item>     images = pdProdImgService.getList(imgReq);
        List<PdProdOptDto.Item>     groups = pdProdOptService.getList(optReq);
        List<PdProdOptItemDto.Item> items  = pdProdOptItemService.getList(itemReq);
        List<PdProdSkuDto.Item>     skus   = pdProdSkuService.getList(skuReq);

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

    public List<PdProdContentDto.Item> getContents(String prodId) {
        PdProdContentDto.Request req = new PdProdContentDto.Request();
        req.setProdId(prodId);
        return pdProdContentService.getList(req);
    }

    /** getRels — 조회 */
    public List<PdProdRelDto.Item> getRels(String prodId) {
        PdProdRelDto.Request req = new PdProdRelDto.Request();
        req.setProdId(prodId);
        return pdProdRelService.getList(req);
    }

    /* ── Tier 2 — 리뷰 / Q&A ─────────────────────────────────── */

    /**
     * 상품별 리뷰 목록 + 평점 집계 요약 + 상단 이미지 모음.
     * 응답: { summary, attachImages, reviewPage: PageResponse }
     */
    public Map<String, Object> getReviews(String prodId, PdReviewDto.Request req) {
        if (req == null) req = new PdReviewDto.Request();
        req.setProdId(prodId);

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("summary", new LinkedHashMap<>());

        PdReviewAttachDto.Request attachReq = new PdReviewAttachDto.Request();
        attachReq.setProdId(prodId);
        result.put("attachImages", pdReviewAttachService.getList(attachReq));

        PdReviewDto.PageResponse page = pdReviewService.getPageData(req);
        result.put("reviewPage", page);
        return result;
    }

    /**
     * 상품별 리뷰 첨부이미지 전체 — 모아보기 팝업용.
     */
    public List<PdReviewAttachDto.Item> getReviewImages(String prodId) {
        PdReviewAttachDto.Request req = new PdReviewAttachDto.Request();
        req.setProdId(prodId);
        return pdReviewAttachService.getList(req);
    }

    /**
     * 상품별 Q&A 목록.
     * 응답: { qnaPage: PageResponse }
     */
    public Map<String, Object> getQna(String prodId, PdProdQnaDto.Request req) {
        if (req == null) req = new PdProdQnaDto.Request();
        req.setProdId(prodId);

        Map<String, Object> result = new LinkedHashMap<>();
        PdProdQnaDto.PageResponse page = pdProdQnaService.getPageData(req);
        result.put("qnaPage", page);
        return result;
    }

    /* ── Tier 3: 프로모션 (통합, 사용자별 동적) ───────────────── */

    /**
     * 상품 적용 가능 프로모션 통합 응답.
     * 응답: { coupons, discnts, gifts, events }
     */
    public Map<String, Object> getPromotions(String prodId) {
        PdProdDto.Item prod = pdProdMapper.selectById(prodId);
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
