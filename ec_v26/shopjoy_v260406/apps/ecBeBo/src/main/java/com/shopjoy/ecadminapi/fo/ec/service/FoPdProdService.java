package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponProdRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntProdRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventProdRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveProdRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
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
    private final PmSaveService         pmSaveService;
    private final PmCouponProdRepository pmCouponProdRepository;
    private final PmDiscntProdRepository pmDiscntProdRepository;
    private final PmEventProdRepository  pmEventProdRepository;
    private final PmSaveProdRepository   pmSaveProdRepository;

    /* ── 목록 ────────────────────────────────────────────────── */


    /* 목록조회 */
    public List<PdProdDto.Item> getList(PdProdDto.Request req) {
        req.setCurrentYn("Y");   // FO 강제 — 전시중(ACTIVE) + 전시기간 이내만 (아래 주석 참조)
        // [QueryDSL] 상품 목록 조회
        List<PdProdDto.Item> list = pdProdRepository.selectList(req);
        list.forEach(FoPdProdService::_fillSaleStateCd);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 */
    public BasePage<PdProdDto.Item> getPageData(PdProdDto.Request req) {
        req.setCurrentYn("Y");   // FO 강제 — 전시중(ACTIVE) + 전시기간 이내만 (아래 주석 참조)
        BasePage<PdProdDto.Item> res = pdProdService.getPageData(req);
        res.getPageList().forEach(FoPdProdService::_fillSaleStateCd);
        _listFillRelations(res.getPageList());
        return res;
    }

    /**
     * saleStateCd 계산 — "노출(전시중)"과 "구매가능(판매중)"은 별개 개념이라 상태 컬럼 하나로 합치지
     * 않고 응답 시점에 판매기간(sale_start_date~sale_end_date)·재고(sold_out_yn)로 직접 판정한다.
     * prod_status_cd 는 이미 currentYn='Y' 필터에서 ACTIVE(전시중)로 걸러졌으므로 여기선 그 안에서
     * SCHEDULED(출시예정)/ON_SALE(판매중)/SOLDOUT(품절)/ENDED(판매기간종료, 배치 반영 전 짧은 유예)만
     * 가른다. FO 화면은 이 값 하나로 배지·구매버튼 활성화 여부를 결정하면 된다.
     */
    private static void _fillSaleStateCd(PdProdDto.Item prod) {
        if ("Y".equals(prod.getSoldOutYn())) {
            prod.setSaleStateCd("SOLDOUT");
            return;
        }
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime start = prod.getSaleStartDate();
        java.time.LocalDateTime end = prod.getSaleEndDate();
        if (start != null && now.isBefore(start)) {
            prod.setSaleStateCd("SCHEDULED");
        } else if (end != null && now.isAfter(end)) {
            prod.setSaleStateCd("ENDED");
        } else {
            prod.setSaleStateCd("ON_SALE");
        }
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


        // 옵션값 일괄조회 → Map<prodId, List<opt>> (pd_prod_opt 에 prodId 직접 보유)
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdIds(prodIds);
        Map<String, List<PdProdOptDto.Item>> itemMap = pdProdOptService.getList(optReq).stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdOptDto.Item::getProdId));

        // SKU 일괄조회 → Map<prodId, List<sku>>
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdIds(prodIds);
        Map<String, List<PdProdSkuDto.Item>> skuMap = pdProdSkuService.getList(skuReq).stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdSkuDto.Item::getProdId));

        // 각 항목에 분배
        for (PdProdDto.Item prod : list) {
            String pid = prod.getProdId();
            prod.setProdImgs(imgMap.getOrDefault(pid, List.of()));         // 이미지목록
            prod.setProdOpts(itemMap.getOrDefault(pid, List.of()));        // 옵션값목록
            prod.setProdSkus(skuMap.getOrDefault(pid, List.of()));         // SKU목록
        }
    }

    /* ── Tier 1: 첫 화면 통합 (prod + images + opts + skus) ─── */

    /* getDetail */
    public PdProdDto.Item getDetail(String prodId) {
        // [QueryDSL] 상품 단건 조회
        PdProdDto.Item prod = pdProdRepository.selectById(prodId).orElse(null);
        if (prod == null) throw new CmBizException("존재하지 않는 상품입니다: " + prodId + "::" + CmUtil.svcCallerInfo(this));
        _fillSaleStateCd(prod);
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

        // 하위 옵션유형 목록 조회 (prodId 기준)

        // 하위 옵션값 목록 조회 (prodId 기준)
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdId(prodId);
        List<PdProdOptDto.Item> prodOpts = pdProdOptService.getList(optReq);

        // 하위 SKU 목록 조회 (prodId 기준)
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdId(prodId);
        List<PdProdSkuDto.Item> prodSkus = pdProdSkuService.getList(skuReq);

        prod.setProdImgs(prodImgs);           // 이미지목록
        prod.setProdOpts(prodOpts);           // 옵션값목록
        prod.setProdSkus(prodSkus);           // SKU목록
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

        BasePage<PdReviewDto.Item> page = pdReviewService.getPageData(req);
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
        BasePage<PdProdQnaDto.Item> page = pdProdQnaService.getPageData(req);
        result.put("qnaPage", page);
        return result;
    }

    /* ── Tier 3: 프로모션 (통합, 사용자별 동적) ───────────────── */

    /**
     * 상품 적용 가능 프로모션 통합 응답.
     * 응답: { coupons, discnts, gifts, events }
     */
    public Map<String, Object> getPromotions(String prodId) {
        // [QueryDSL] 상품 단건 조회
        PdProdDto.Item prod = pdProdRepository.selectById(prodId).orElse(null);

        // pm_*_prod 테이블에서 이 상품에 적용 가능한 ID 목록 조회
        // [QueryDSL] 쿠폰 적용 상품 전개 (배치 생성) 조회
        List<String> couponIds = pmCouponProdRepository.selectCouponIdsByProdId(prodId);
        // [QueryDSL] 할인 적용 상품 전개 (배치 생성) 조회
        List<String> discntIds = pmDiscntProdRepository.selectDiscntIdsByProdId(prodId);
        // [QueryDSL] 이벤트 적용 상품 전개 (배치 생성) 조회
        List<String> eventIds  = pmEventProdRepository.selectEventIdsByProdId(prodId);
        // [QueryDSL] 적립금 적용 상품 전개 (배치 생성) 조회
        List<String> saveIds   = pmSaveProdRepository.selectSaveIdsByProdId(prodId);

        Map<String, Object> result = new LinkedHashMap<>();

        /* ⚠ 아래 각 블록은 위에서 구한 *_prod 매핑 ID 목록을 반드시 Request 에 set 해야 한다.
           set 하지 않으면 "이 상품의 프로모션"이 아니라 사이트 전체 프로모션이 통째로 응답된다
           (2026-08-19 수정 — 이전에는 ID 목록을 구해놓고 request 에 넣지 않아 전체가 나가고 있었음).
           또한 FO 응답이므로 currentYn='Y' 를 강제해 만료/미시작 프로모션을 제외한다. */
        if (!couponIds.isEmpty()) {
            PmCouponDto.Request req = new PmCouponDto.Request();
            req.setCouponIds(couponIds);
            req.setCurrentYn("Y");
            result.put("coupons", pmCouponService.getList(req));
        } else {
            result.put("coupons", List.of());
        }

        if (!discntIds.isEmpty()) {
            PmDiscntDto.Request req = new PmDiscntDto.Request();
            req.setDiscntIds(discntIds);
            req.setCurrentYn("Y");
            result.put("discnts", pmDiscntService.getList(req));
        } else {
            result.put("discnts", List.of());
        }

        // 사은품(gift)은 *_prod 테이블 미운용 — 상품 한정 없이 조회하되 현재 유효건만
        PmGiftDto.Request giftReq = new PmGiftDto.Request();
        giftReq.setCurrentYn("Y");
        result.put("gifts", pmGiftService.getList(giftReq));

        if (!eventIds.isEmpty()) {
            PmEventDto.Request req = new PmEventDto.Request();
            req.setEventIds(eventIds);
            req.setCurrentYn("Y");
            result.put("events", pmEventService.getList(req));
        } else {
            result.put("events", List.of());
        }

        /* ⚠ saves 는 currentYn 을 걸지 않는다 — pm_save 는 적립/사용/소멸 "거래원장"이라
           유효기간(start/end)·use_yn 자체가 없기 때문(설정하면 조용히 무시될 뿐이라 오해 소지).
           적립 "정책"은 별도 테이블 pm_save_policy 이고 pm_save_item.save_id 도 실제로는
           pm_save_policy.save_policy_id 를 참조한다 — 이 블록이 정책이 아닌 원장을 조회하는
           구조는 별도 확인 필요(2026-08-19 확인된 사항, 이번 변경 범위 밖). */
        if (!saveIds.isEmpty()) {
            PmSaveDto.Request req = new PmSaveDto.Request();
            req.setSaveIds(saveIds);
            result.put("saves", pmSaveService.getList(req));
        } else {
            result.put("saves", List.of());
        }

        return result;
    }
}
