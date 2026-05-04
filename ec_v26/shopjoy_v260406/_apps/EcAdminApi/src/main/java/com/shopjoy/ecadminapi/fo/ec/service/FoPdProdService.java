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
public class FoPdProdService {

    private final PdProdMapper mapper;
    private final PdProdImgService     imgService;
    private final PdProdOptService     optService;
    private final PdProdOptItemService optItemService;
    private final PdProdSkuService     skuService;
    private final PdProdContentService contentService;
    private final PdProdRelService     relService;
    private final PdReviewService      reviewService;
    private final PdProdQnaService     qnaService;
    private final PmCouponService      couponService;
    private final PmDiscntService      discntService;
    private final PmGiftService        giftService;
    private final PmEventService       eventService;

    /* ── 목록 ────────────────────────────────────────────────── */

    @Transactional(readOnly = true)
    public List<PdProdDto> getList(Map<String, Object> p) {
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /* ── Tier 1: 첫 화면 통합 (prod + images + opts + skus) ─── */

    @Transactional(readOnly = true)
    public Map<String, Object> getDetail(String prodId) {
        PdProdDto prod = mapper.selectById(prodId);
        if (prod == null) throw new CmBizException("존재하지 않는 상품입니다: " + prodId);

        Map<String, Object> p = new HashMap<>();
        p.put("prodId", prodId);

        List<PdProdImgDto>     images = imgService.getList(p);
        List<PdProdOptDto>     groups = optService.getList(new HashMap<>(p));
        List<PdProdOptItemDto> items  = optItemService.getList(new HashMap<>(p));
        List<PdProdSkuDto>     skus   = skuService.getList(new HashMap<>(p));

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

    @Transactional(readOnly = true)
    public List<PdProdContentDto> getContents(String prodId) {
        Map<String, Object> p = new HashMap<>();
        p.put("prodId", prodId);
        return contentService.getList(p);
    }

    @Transactional(readOnly = true)
    public List<PdProdRelDto> getRels(String prodId) {
        Map<String, Object> p = new HashMap<>();
        p.put("prodId", prodId);
        return relService.getList(p);
    }

    /* ── Tier 2 — 리뷰 / Q&A ─────────────────────────────────── */

    /**
     * 상품별 리뷰 목록 + 평점 집계 요약.
     * 응답: { summary: { total, avgRating, rate1~5 }, items, total }
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getReviews(String prodId, Map<String, Object> p) {
        Map<String, Object> param = (p != null) ? new HashMap<>(p) : new HashMap<>();
        param.put("prodId", prodId);
        // 노출 가능한 리뷰만 (사용자 화면)
        if (!param.containsKey("status")) param.put("status", "ACTIVE");

        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> summary = reviewService.getRatingSummary(prodId);
        result.put("summary", summary != null ? summary : new LinkedHashMap<>());

        if (param.containsKey("pageSize")) {
            // 페이징 요청
            PageResult<PdReviewDto> page = reviewService.getPageData(param);
            result.put("items", page.getPageList());
            result.put("total", page.getPageTotalCount());
        } else {
            List<PdReviewDto> items = reviewService.getList(param);
            result.put("items", items);
            result.put("total", items != null ? items.size() : 0);
        }
        return result;
    }

    /**
     * 상품별 Q&A 목록.
     * 응답: { items, total }
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getQna(String prodId, Map<String, Object> p) {
        Map<String, Object> param = (p != null) ? new HashMap<>(p) : new HashMap<>();
        param.put("prodId", prodId);

        Map<String, Object> result = new LinkedHashMap<>();
        if (param.containsKey("pageSize")) {
            PageResult<PdProdQnaDto> page = qnaService.getPageData(param);
            result.put("items", page.getPageList());
            result.put("total", page.getPageTotalCount());
        } else {
            List<PdProdQnaDto> items = qnaService.getList(param);
            result.put("items", items);
            result.put("total", items != null ? items.size() : 0);
        }
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
    @Transactional(readOnly = true)
    public Map<String, Object> getPromotions(String prodId) {
        // 상품의 사이트 컨텍스트 — 자기 사이트 프로모션만 노출
        PdProdDto prod = mapper.selectById(prodId);
        Map<String, Object> p = new HashMap<>();
        if (prod != null && prod.getSiteId() != null) {
            p.put("siteId", prod.getSiteId());
        }
        // 활성만
        p.put("useYn", "Y");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("coupons", safeList(() -> couponService.getList(new HashMap<>(p))));
        result.put("discnts", safeList(() -> discntService.getList(new HashMap<>(p))));
        result.put("gifts",   safeList(() -> giftService.getList(new HashMap<>(p))));
        result.put("events",  safeList(() -> eventService.getList(new HashMap<>(p))));
        return result;
    }

    /**
     * 프로모션 도메인 service 호출 시 예외/null 안전 fallback.
     * 일부 프로모션 타입 데이터 미설정 상태에서 전체 응답이 깨지지 않게 보호.
     */
    private static List<?> safeList(java.util.function.Supplier<List<?>> supplier) {
        try {
            List<?> r = supplier.get();
            return r != null ? r : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }
}
