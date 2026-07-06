package com.shopjoy.ecadminapi.bo.zd;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberGradeService;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberService;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.service.OdClaimService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderService;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdDlivTmpltService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptItemService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdSkuService;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmPlanService;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveService;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * ZdSimulController — 시뮬레이터 전용 API
 *
 * 모든 시뮬레이터 생성/수정은 이 Controller를 통한다.
 * 각 도메인 Controller의 경로(/save/base 등)가 존재하지 않아 404가 발생하므로
 * 시뮬 전용 통합 엔드포인트로 일원화한다.
 */
@Slf4j
@RestController
@RequestMapping("/api/bo/zd/simul")
@RequiredArgsConstructor
public class ZdSimulController {

    private final PdProdService        pdProdService;
    private final PdProdOptService     pdProdOptService;
    private final PdProdOptItemService pdProdOptItemService;
    private final PdProdSkuService     pdProdSkuService;
    private final PdProdImgService     pdProdImgService;
    private final PdDlivTmpltService   pdDlivTmpltService;
    private final MbMemberService      mbMemberService;
    private final MbMemberGradeService mbMemberGradeService;
    private final OdOrderService       odOrderService;
    private final OdClaimService       odClaimService;
    private final PmEventService       pmEventService;
    private final PmPlanService        pmPlanService;
    private final PmCouponService      pmCouponService;
    private final PmDiscntService      pmDiscntService;
    private final PmSaveService        pmSaveService;
    private final StSettleService      stSettleService;
    private final PasswordEncoder      passwordEncoder;
    private final ZdSimulLogRepository zdSimulLogRepository;

    /* ═══════════════════════════════════════════════════════════
       실행 로그
    ═══════════════════════════════════════════════════════════ */

    /** 로그 목록 조회 (페이징) */
    @GetMapping("/log/page")
    public ResponseEntity<ApiResponse<PageResult<ZdSimulLog>>> logPage(
            @RequestParam Map<String, Object> p) {
        String siteId  = SecurityUtil.getSiteIdOrDefault("SITE000001");
        int pageNo     = p.containsKey("pageNo")   ? Integer.parseInt(p.get("pageNo").toString())   : 1;
        int pageSize   = p.containsKey("pageSize")  ? Integer.parseInt(p.get("pageSize").toString()) : 10;
        String domain  = blankToNull(str(p, "domain",  null));
        String uiNm    = blankToNull(str(p, "uiNm",    null));
        String userNm  = blankToNull(str(p, "userNm",  null));

        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);
        Page<ZdSimulLog> page = zdSimulLogRepository.search(siteId, domain, uiNm, userNm, pageable);

        PageResult<ZdSimulLog> result = PageResult.of(
            page.getContent(), page.getTotalElements(), pageNo, pageSize, p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 로그 저장 */
    @PostMapping("/log/save")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> logSave(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        ZdSimulLog log = new ZdSimulLog();
        log.setLogId(CmUtil.generateId("zd_simul_log"));
        log.setSiteId(siteId);
        log.setDomain(str(body, "domain", "unknown"));
        log.setSimulMode(str(body, "mode", "생성"));
        log.setSimulStatus(str(body, "status", "SUCCESS"));
        log.setDescTxt(str(body, "desc", null));
        log.setReasonTxt(str(body, "reason", null));
        log.setTargetId(str(body, "targetId", null));
        log.setUserNm(str(body, "userNm", null));
        log.setUiNm(str(body, "uiNm", null));
        ZdSimulLog saved = zdSimulLogRepository.save(log);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("logId", saved.getLogId())));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    /* ═══════════════════════════════════════════════════════════
       DEFAULTS
    ═══════════════════════════════════════════════════════════ */

    @PostMapping("/prod/defaults")
    public ResponseEntity<ApiResponse<Map<String, Object>>> prodDefaults() {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        PdDlivTmpltDto.Request req = new PdDlivTmpltDto.Request();
        req.setSiteId(siteId);
        List<PdDlivTmpltDto.Item> list = pdDlivTmpltService.getList(req);
        String dlivTmpltId = list.isEmpty() || list.get(0).getDlivTmpltId() == null ? "" : list.get(0).getDlivTmpltId();
        String dlivTmpltNm = list.isEmpty() || list.get(0).getDlivTmpltNm() == null ? "" : list.get(0).getDlivTmpltNm();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "siteId", siteId, "dlivTmpltId", dlivTmpltId, "dlivTmpltNm", dlivTmpltNm)));
    }

    @PostMapping("/member/defaults")
    public ResponseEntity<ApiResponse<Map<String, Object>>> memberDefaults() {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        MbMemberGradeDto.Request req = new MbMemberGradeDto.Request();
        req.setSiteId(siteId);
        List<MbMemberGradeDto.Item> grades = mbMemberGradeService.getList(req);
        String memberGradeId = grades.isEmpty() || grades.get(0).getMemberGradeId() == null ? "" : grades.get(0).getMemberGradeId();
        String gradeNm       = grades.isEmpty() || grades.get(0).getGradeNm()       == null ? "" : grades.get(0).getGradeNm();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "siteId", siteId, "memberGradeId", memberGradeId, "gradeNm", gradeNm)));
    }

    /* ═══════════════════════════════════════════════════════════
       상품 시뮬
    ═══════════════════════════════════════════════════════════ */

    /** 상품 생성 — 옵션/SKU/이미지 통합 */
    @PostMapping("/prod/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> prodCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");

        PdProd prod = new PdProd();
        VoUtil.mapCopy(body, prod, "optGroups", "images");
        prod.setSiteId(siteId);
        prod.setSimulYn("Y");
        PdProd saved = pdProdService.create(prod);
        String prodId = saved.getProdId();

        /* 옵션형: optGroups 처리 */
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> optGroups = body.get("optGroups") instanceof List
            ? (List<Map<String, Object>>) body.get("optGroups") : null;

        if (optGroups != null && !optGroups.isEmpty()) {
            List<String> grp1ItemIds = new ArrayList<>();
            List<String> grp2ItemIds = new ArrayList<>();

            for (Map<String, Object> grp : optGroups) {
                PdProdOpt opt = new PdProdOpt();
                opt.setSiteId(siteId);
                opt.setProdId(prodId);
                opt.setOptGrpNm(str(grp, "grpNm"));
                opt.setOptLevel(intVal(grp, "level", 1));
                opt.setOptInputTypeCd(str(grp, "inputTypeCd", "SELECT"));
                opt.setSortOrd(intVal(grp, "sortOrd", 1));
                PdProdOpt savedOpt = pdProdOptService.create(opt);
                String optId = savedOpt.getOptId();

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> items = grp.get("items") instanceof List
                    ? (List<Map<String, Object>>) grp.get("items") : List.of();

                int level = intVal(grp, "level", 1);
                for (Map<String, Object> it : items) {
                    PdProdOptItem optItem = new PdProdOptItem();
                    optItem.setSiteId(siteId);
                    optItem.setOptId(optId);
                    optItem.setOptNm(str(it, "nm"));
                    optItem.setOptVal(str(it, "val"));
                    optItem.setSortOrd(intVal(it, "sortOrd", 1));
                    optItem.setUseYn(str(it, "useYn", "Y"));
                    PdProdOptItem savedItem = pdProdOptItemService.create(optItem);
                    if (level == 1) grp1ItemIds.add(savedItem.getOptItemId());
                    else grp2ItemIds.add(savedItem.getOptItemId());
                }
            }

            /* SKU 조합 (그룹1 × 그룹2) */
            if (!grp1ItemIds.isEmpty()) {
                if (grp2ItemIds.isEmpty()) {
                    for (int i = 0; i < grp1ItemIds.size(); i++) {
                        PdProdSku sku = new PdProdSku();
                        sku.setSiteId(siteId);
                        sku.setProdId(prodId);
                        sku.setOptItemId1(grp1ItemIds.get(i));
                        sku.setAddPrice((long) (i * 1000));
                        sku.setProdOptStock(10);
                        sku.setUseYn("Y");
                        pdProdSkuService.create(sku);
                    }
                } else {
                    for (int i = 0; i < grp1ItemIds.size(); i++) {
                        for (int j = 0; j < grp2ItemIds.size(); j++) {
                            PdProdSku sku = new PdProdSku();
                            sku.setSiteId(siteId);
                            sku.setProdId(prodId);
                            sku.setOptItemId1(grp1ItemIds.get(i));
                            sku.setOptItemId2(grp2ItemIds.get(j));
                            sku.setAddPrice((long) (i * 1000));
                            sku.setProdOptStock(10);
                            sku.setUseYn("Y");
                            pdProdSkuService.create(sku);
                        }
                    }
                }
            }

            /* 이미지 (색상별 picsum URL) */
            for (int i = 0; i < grp1ItemIds.size(); i++) {
                PdProdImg img = new PdProdImg();
                img.setSiteId(siteId);
                img.setProdId(prodId);
                img.setOptItemId1(grp1ItemIds.get(i));
                img.setCdnImgUrl("https://picsum.photos/seed/" + (200 + i * 37) + "/400/400");
                img.setIsThumb(i == 0 ? "Y" : "N");
                img.setSortOrd(i + 1);
                pdProdImgService.create(img);
            }
        } else {
            /* 단순 상품: 대표 이미지 1장 */
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> images = body.get("images") instanceof List
                ? (List<Map<String, Object>>) body.get("images") : null;
            if (images != null) {
                for (int i = 0; i < images.size(); i++) {
                    PdProdImg img = new PdProdImg();
                    img.setSiteId(siteId);
                    img.setProdId(prodId);
                    img.setCdnImgUrl(str(images.get(i), "cdnImgUrl"));
                    img.setIsThumb(i == 0 ? "Y" : "N");
                    img.setSortOrd(i + 1);
                    pdProdImgService.create(img);
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("prodId", prodId)));
    }

    /** 상품 수정 */
    @PostMapping("/prod/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> prodUpdate(
            @RequestBody Map<String, Object> body) {
        String prodId = requireStr(body, "prodId");
        PdProd patch = new PdProd();
        VoUtil.mapCopy(body, patch, "prodId");
        pdProdService.update(prodId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("prodId", prodId)));
    }

    /* ═══════════════════════════════════════════════════════════
       주문 시뮬 — 랜덤 상품 조회
    ═══════════════════════════════════════════════════════════ */

    @PostMapping("/order/rand-prod")
    public ResponseEntity<ApiResponse<Map<String, Object>>> orderRandProd(
            @RequestBody(required = false) Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        int count = body != null && body.get("count") instanceof Number
            ? ((Number) body.get("count")).intValue() : 3;
        String statusCd = body != null && body.get("prodStatusCd") instanceof String
            ? (String) body.get("prodStatusCd") : "SELLING";

        PdProdDto.Request req = new PdProdDto.Request();
        req.setSiteId(siteId);
        req.setProdStatusCd(statusCd);
        req.setPageSize(50);
        List<PdProdDto.Item> all = pdProdService.getList(req);
        Collections.shuffle(all);

        List<Map<String, Object>> prods = all.stream().limit(count).map(p -> Map.<String, Object>of(
            "prodId",    p.getProdId() != null ? p.getProdId() : "",
            "prodNm",    p.getProdNm()    != null ? p.getProdNm()    : "",
            "salePrice", p.getSalePrice() != null ? p.getSalePrice() : 0L,
            "prodStock", p.getProdStock() != null ? p.getProdStock() : 0
        )).toList();

        return ResponseEntity.ok(ApiResponse.ok(Map.of("prods", prods)));
    }

    /* ═══════════════════════════════════════════════════════════
       주문 시뮬
    ═══════════════════════════════════════════════════════════ */

    /** 주문 생성 */
    @PostMapping("/order/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> orderCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        OdOrder order = new OdOrder();
        VoUtil.mapCopy(body, order);
        order.setSiteId(siteId);
        order.setSimulYn("Y");
        OdOrder saved = odOrderService.create(order);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("orderId", saved.getOrderId())));
    }

    /** 주문 수정 */
    @PostMapping("/order/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> orderUpdate(
            @RequestBody Map<String, Object> body) {
        String orderId = requireStr(body, "orderId");
        OdOrder patch = new OdOrder();
        VoUtil.mapCopy(body, patch, "orderId");
        odOrderService.update(orderId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("orderId", orderId)));
    }

    /* ═══════════════════════════════════════════════════════════
       클레임 시뮬
    ═══════════════════════════════════════════════════════════ */

    /** 클레임 생성 — 주문 ID 기반 자동 생성 */
    @PostMapping("/claim/from-order")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> claimFromOrder(
            @RequestBody Map<String, Object> body) {
        String siteId  = SecurityUtil.getSiteIdOrDefault("SITE000001");
        String orderId = requireStr(body, "orderId");
        String typeCd   = body.getOrDefault("claimTypeCd",   "CANCEL").toString();
        String reasonCd = body.getOrDefault("reasonCd",      "CHANGE_MIND").toString();
        String statusCd = body.getOrDefault("claimStatusCd", "CLAIM_RECV").toString();
        boolean partial = Boolean.TRUE.equals(body.get("partialClaim"));
        int refundRate  = body.get("refundRate") instanceof Number
            ? ((Number) body.get("refundRate")).intValue() : 100;

        OdOrderDto.Item order = odOrderService.getById(orderId);
        List<OdOrderItemDto.Item> items = order.getOrderItems();

        long refundAmt = 0L;
        if (items != null && !items.isEmpty()) {
            List<OdOrderItemDto.Item> selected = items.stream()
                .filter(it -> !partial || Math.random() > 0.3).toList();
            if (selected.isEmpty()) selected = List.of(items.get(0));
            for (OdOrderItemDto.Item it : selected) {
                int qty = (partial && it.getOrderQty() != null && it.getOrderQty() > 1)
                    ? (int)(Math.random() * it.getOrderQty()) + 1
                    : (it.getOrderQty() != null ? it.getOrderQty() : 1);
                long unitAmt = it.getUnitPrice() != null ? it.getUnitPrice() : 0L;
                refundAmt += unitAmt * qty;
            }
        } else {
            Long payAmt = order.getPayAmt();
            refundAmt = payAmt != null ? (long)(payAmt * refundRate / 100.0) : 10000L;
        }

        long finalRefund = (long)(refundAmt * refundRate / 100.0);
        OdClaim claim = new OdClaim();
        claim.setSiteId(siteId);
        claim.setOrderId(orderId);
        claim.setClaimTypeCd(typeCd);
        claim.setReasonCd(reasonCd);
        claim.setClaimStatusCd(statusCd);
        claim.setRefundAmt(finalRefund);
        claim.setSimulYn("Y");
        OdClaim saved = odClaimService.create(claim);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "claimId",     saved.getClaimId(),
            "claimTypeCd", typeCd,
            "refundAmt",   finalRefund,
            "itemCount",   items != null ? items.size() : 0
        )));
    }

    /** 클레임 수정 */
    @PostMapping("/claim/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> claimUpdate(
            @RequestBody Map<String, Object> body) {
        String claimId = requireStr(body, "claimId");
        OdClaim patch = new OdClaim();
        VoUtil.mapCopy(body, patch, "claimId");
        odClaimService.update(claimId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("claimId", claimId)));
    }

    /* ═══════════════════════════════════════════════════════════
       회원 시뮬
    ═══════════════════════════════════════════════════════════ */

    /** 회원 생성 */
    @PostMapping("/member/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> memberCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        MbMember member = new MbMember();
        VoUtil.mapCopy(body, member);
        member.setSiteId(siteId);
        member.setSimulYn("Y");
        String rawPwd = body.get("loginPwd") instanceof String s && !s.isBlank() ? s : "1111";
        member.setLoginPwdHash(passwordEncoder.encode(rawPwd));
        MbMember saved = mbMemberService.create(member);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("memberId", saved.getMemberId())));
    }

    /** 회원 수정 */
    @PostMapping("/member/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> memberUpdate(
            @RequestBody Map<String, Object> body) {
        String memberId = requireStr(body, "memberId");
        MbMember patch = new MbMember();
        VoUtil.mapCopy(body, patch, "memberId");
        mbMemberService.update(memberId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("memberId", memberId)));
    }

    /* ═══════════════════════════════════════════════════════════
       이벤트 시뮬
    ═══════════════════════════════════════════════════════════ */

    @PostMapping("/event/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> eventCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        PmEvent event = new PmEvent();
        VoUtil.mapCopy(body, event);
        event.setSiteId(siteId);
        event.setSimulYn("Y");
        PmEvent saved = pmEventService.create(event);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("eventId", saved.getEventId())));
    }

    @PostMapping("/event/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> eventUpdate(
            @RequestBody Map<String, Object> body) {
        String eventId = requireStr(body, "eventId");
        PmEvent patch = new PmEvent();
        VoUtil.mapCopy(body, patch, "eventId");
        pmEventService.update(eventId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("eventId", eventId)));
    }

    /* ═══════════════════════════════════════════════════════════
       기획전 시뮬
    ═══════════════════════════════════════════════════════════ */

    @PostMapping("/plan/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> planCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        PmPlan plan = new PmPlan();
        VoUtil.mapCopy(body, plan, "items", "addProdIds");
        plan.setSiteId(siteId);
        plan.setSimulYn("Y");
        PmPlan saved = pmPlanService.create(plan);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("planId", saved.getPlanId())));
    }

    @PostMapping("/plan/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> planUpdate(
            @RequestBody Map<String, Object> body) {
        String planId = requireStr(body, "planId");
        PmPlan patch = new PmPlan();
        VoUtil.mapCopy(body, patch, "planId", "addProdIds");
        pmPlanService.update(planId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("planId", planId)));
    }

    /* ═══════════════════════════════════════════════════════════
       프로모션 시뮬 (쿠폰 / 할인 / 적립)
    ═══════════════════════════════════════════════════════════ */

    @PostMapping("/promo/coupon-create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> promoCouponCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        PmCoupon coupon = new PmCoupon();
        VoUtil.mapCopy(body, coupon);
        coupon.setSiteId(siteId);
        coupon.setSimulYn("Y");
        PmCoupon saved = pmCouponService.create(coupon);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("couponId", saved.getCouponId())));
    }

    @PostMapping("/promo/discnt-create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> promoDiscntCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        PmDiscnt discnt = new PmDiscnt();
        VoUtil.mapCopy(body, discnt);
        discnt.setSiteId(siteId);
        discnt.setSimulYn("Y");
        PmDiscnt saved = pmDiscntService.create(discnt);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("discntId", saved.getDiscntId())));
    }

    @PostMapping("/promo/save-create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> promoSaveCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        PmSave pmSave = new PmSave();
        VoUtil.mapCopy(body, pmSave);
        pmSave.setSiteId(siteId);
        pmSave.setSimulYn("Y");
        PmSave saved = pmSaveService.create(pmSave);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("saveId", saved.getSaveId())));
    }

    @PostMapping("/promo/coupon-update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> promoCouponUpdate(
            @RequestBody Map<String, Object> body) {
        String couponId = requireStr(body, "couponId");
        PmCoupon patch = new PmCoupon();
        VoUtil.mapCopy(body, patch, "couponId");
        pmCouponService.update(couponId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("couponId", couponId)));
    }

    @PostMapping("/promo/discnt-update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> promoDiscntUpdate(
            @RequestBody Map<String, Object> body) {
        String discntId = requireStr(body, "discntId");
        PmDiscnt patch = new PmDiscnt();
        VoUtil.mapCopy(body, patch, "discntId");
        pmDiscntService.update(discntId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("discntId", discntId)));
    }

    /* ═══════════════════════════════════════════════════════════
       정산 시뮬
    ═══════════════════════════════════════════════════════════ */

    @PostMapping("/settle/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> settleCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");
        StSettle settle = new StSettle();
        VoUtil.mapCopy(body, settle);
        settle.setSiteId(siteId);
        settle.setSimulYn("Y");
        StSettle saved = stSettleService.create(settle);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("settleId", saved.getSettleId())));
    }

    @PostMapping("/settle/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> settleUpdate(
            @RequestBody Map<String, Object> body) {
        String settleId = requireStr(body, "settleId");
        StSettle patch = new StSettle();
        VoUtil.mapCopy(body, patch, "settleId");
        stSettleService.update(settleId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("settleId", settleId)));
    }

    /* ─── 헬퍼 ─────────────────────────────────────────────── */

    private static String requireStr(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (!(v instanceof String) || ((String) v).isBlank())
            throw new CmBizException(key + " 가 필요합니다.");
        return (String) v;
    }

    private static String str(Map<String, Object> m, String key) {
        return str(m, key, "");
    }
    private static String str(Map<String, Object> m, String key, String def) {
        Object v = m.get(key);
        return v instanceof String ? (String) v : def;
    }
    private static int intVal(Map<String, Object> m, String key, int def) {
        Object v = m.get(key);
        return v instanceof Number ? ((Number) v).intValue() : def;
    }
}
