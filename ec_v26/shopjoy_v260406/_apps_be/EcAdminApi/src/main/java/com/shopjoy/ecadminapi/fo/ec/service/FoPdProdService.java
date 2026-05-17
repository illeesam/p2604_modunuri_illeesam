package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.common.util.CmUtil;


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

    private final PdProdRepository      pdProdRepository;
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

    /* 목록조회 */
    public List<PdProdDto.Item> getList(PdProdDto.Request req) {
        List<PdProdDto.Item> list = pdProdRepository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 */
    public PdProdDto.PageResponse getPageData(PdProdDto.Request req) {
        PdProdDto.PageResponse res = pdProdService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (images/opts/skus 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 img 1회 + opt 1회 + optItem 1회 + sku 1회만 조회한다.
     */
    private void _listFillRelations(List<PdProdDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> prodIds = list.stream()
            .map(PdProdDto.Item::getProdId)
            .filter(java.util.Objects::nonNull)
            .distinct()
            .toList();
        if (prodIds.isEmpty()) return;

        // 이미지 일괄조회 → Map<prodId, List<img>>
        PdProdImgDto.Request imgReq = new PdProdImgDto.Request();
        imgReq.setProdIds(prodIds);
        Map<String, List<PdProdImgDto.Item>> imgMap = pdProdImgService.getList(imgReq).stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdImgDto.Item::getProdId));

        // 옵션그룹 일괄조회 → Map<prodId, List<group>> + optId→prodId 매핑
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdIds(prodIds);
        List<PdProdOptDto.Item> allGroups = pdProdOptService.getList(optReq);
        Map<String, List<PdProdOptDto.Item>> groupMap = allGroups.stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdOptDto.Item::getProdId));
        Map<String, String> optIdToProdId = allGroups.stream()
            .collect(java.util.stream.Collectors.toMap(
                PdProdOptDto.Item::getOptId, PdProdOptDto.Item::getProdId, (a, b) -> a));

        // 옵션아이템 일괄조회 → optId 경유로 prodId 그룹핑 (optItem 에는 prodId 필드 없음)
        PdProdOptItemDto.Request itemReq = new PdProdOptItemDto.Request();
        itemReq.setProdIds(prodIds);
        Map<String, List<PdProdOptItemDto.Item>> itemMap = pdProdOptItemService.getList(itemReq).stream()
            .filter(it -> optIdToProdId.get(it.getOptId()) != null)
            .collect(java.util.stream.Collectors.groupingBy(it -> optIdToProdId.get(it.getOptId())));

        // SKU 일괄조회 → Map<prodId, List<sku>>
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdIds(prodIds);
        Map<String, List<PdProdSkuDto.Item>> skuMap = pdProdSkuService.getList(skuReq).stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdSkuDto.Item::getProdId));

        // 각 항목에 분배
        for (PdProdDto.Item prod : list) {
            String pid = prod.getProdId();
            prod.setProdImgs(imgMap.getOrDefault(pid, List.of())); // 이미지목록
            prod.setProdOpts(groupMap.getOrDefault(pid, List.of())); // 옵션목록
            prod.setProdOptItems(itemMap.getOrDefault(pid, List.of())); // 옵션아이템목록
            prod.setProdSkus(skuMap.getOrDefault(pid, List.of())); // SKU목록
        }
    }

    /* ── Tier 1: 첫 화면 통합 (prod + images + opts + skus) ─── */

    /* getDetail */
    public PdProdDto.Item getDetail(String prodId) {
        PdProdDto.Item prod = pdProdRepository.selectById(prodId).orElse(null);
        if (prod == null) throw new CmBizException("존재하지 않는 상품입니다: " + prodId + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(prod);
        return prod;
    }

    /** _itemFillRelations — 단건 연관조회 (images/opts/skus 채우기) */
    private void _itemFillRelations(PdProdDto.Item prod) {
        String prodId = prod.getProdId();

        // 하위 상품이미지 목록 조회 (prodId 기준)
        PdProdImgDto.Request imgReq = new PdProdImgDto.Request();
        imgReq.setProdId(prodId);
        List<PdProdImgDto.Item> prodImgs = pdProdImgService.getList(imgReq);

        // 하위 옵션그룹 목록 조회 (prodId 기준)
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdId(prodId);
        List<PdProdOptDto.Item> prodOpts = pdProdOptService.getList(optReq);

        // 하위 옵션항목 목록 조회 (prodId 기준)
        PdProdOptItemDto.Request itemReq = new PdProdOptItemDto.Request();
        itemReq.setProdId(prodId);
        List<PdProdOptItemDto.Item> prodOptItems = pdProdOptItemService.getList(itemReq);

        // 하위 SKU 목록 조회 (prodId 기준)
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdId(prodId);
        List<PdProdSkuDto.Item> prodSkus = pdProdSkuService.getList(skuReq);

        prod.setProdImgs(prodImgs); // 이미지목록
        prod.setProdOpts(prodOpts); // 옵션목록
        prod.setProdOptItems(prodOptItems); // 옵션아이템목록
        prod.setProdSkus(prodSkus); // SKU목록
    }

    /* ── Tier 2: lazy load ──────────────────────────────────── */

    /* getContents */
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
        PdProdDto.Item prod = pdProdRepository.selectById(prodId).orElse(null);
        String siteId = prod != null ? prod.getSiteId() : null;

        PmCouponDto.Request couponReq = new PmCouponDto.Request();
        couponReq.setSiteId(siteId); couponReq.setUseYn("Y");
        PmDiscntDto.Request discntReq = new PmDiscntDto.Request();
        discntReq.setSiteId(siteId); discntReq.setUseYn("Y");
        PmGiftDto.Request giftReq = new PmGiftDto.Request();
        giftReq.setSiteId(siteId); giftReq.setUseYn("Y");
        PmEventDto.Request eventReq = new PmEventDto.Request();
        eventReq.setSiteId(siteId); eventReq.setUseYn("Y");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("coupons", pmCouponService.getList(couponReq));
        result.put("discnts", pmDiscntService.getList(discntReq));
        result.put("gifts",   pmGiftService.getList(giftReq));
        result.put("events",  pmEventService.getList(eventReq));
        return result;
    }
}
