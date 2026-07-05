package com.shopjoy.ecadminapi.bo.zd;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberGradeService;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.service.OdClaimService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderService;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdDlivTmpltService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * ZdSimulController — 시뮬레이터 전용 API
 *
 * 프론트 시뮬레이터에서 넘기기 어려운 default 값을 백엔드에서 자동 주입하거나
 * 복합 데이터 조합이 필요한 시뮬 전용 엔드포인트를 제공한다.
 *
 * POST /api/bo/zd/simul/prod/defaults         — 상품 생성 default (siteId, dlivTmpltId)
 * POST /api/bo/zd/simul/member/defaults       — 회원 생성 default (siteId, memberGradeId)
 * POST /api/bo/zd/simul/order/rand-prod       — 랜덤 판매중 상품 N개 반환
 * POST /api/bo/zd/simul/claim/from-order      — 주문→클레임 서버사이드 자동 생성
 */
@Slf4j
@RestController
@RequestMapping("/api/bo/zd/simul")
@RequiredArgsConstructor
public class ZdSimulController {

    private final PdProdService        pdProdService;
    private final PdDlivTmpltService   pdDlivTmpltService;
    private final MbMemberGradeService mbMemberGradeService;
    private final OdOrderService       odOrderService;
    private final OdClaimService       odClaimService;

    /* ─────────────────────────────────────────────────────────────
       상품 시뮬 — 생성 default
       응답: { siteId, dlivTmpltId, dlivTmpltNm }
    ───────────────────────────────────────────────────────────── */
    @PostMapping("/prod/defaults")
    public ResponseEntity<ApiResponse<Map<String, Object>>> prodDefaults() {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");

        PdDlivTmpltDto.Request req = new PdDlivTmpltDto.Request();
        req.setSiteId(siteId);
        List<PdDlivTmpltDto.Item> tmpltList = pdDlivTmpltService.getList(req);

        String dlivTmpltId = "";
        String dlivTmpltNm = "";
        if (!tmpltList.isEmpty()) {
            dlivTmpltId = tmpltList.get(0).getDlivTmpltId() != null ? tmpltList.get(0).getDlivTmpltId() : "";
            dlivTmpltNm = tmpltList.get(0).getDlivTmpltNm() != null ? tmpltList.get(0).getDlivTmpltNm() : "";
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "siteId",      siteId,
            "dlivTmpltId", dlivTmpltId,
            "dlivTmpltNm", dlivTmpltNm
        )));
    }

    /* ─────────────────────────────────────────────────────────────
       회원 시뮬 — 생성 default
       응답: { siteId, memberGradeId, gradeNm }
    ───────────────────────────────────────────────────────────── */
    @PostMapping("/member/defaults")
    public ResponseEntity<ApiResponse<Map<String, Object>>> memberDefaults() {
        String siteId = SecurityUtil.getSiteIdOrDefault("SITE000001");

        MbMemberGradeDto.Request gradeReq = new MbMemberGradeDto.Request();
        gradeReq.setSiteId(siteId);
        List<MbMemberGradeDto.Item> grades = mbMemberGradeService.getList(gradeReq);

        String memberGradeId = "";
        String gradeNm       = "";
        if (!grades.isEmpty()) {
            memberGradeId = grades.get(0).getMemberGradeId() != null ? grades.get(0).getMemberGradeId() : "";
            gradeNm       = grades.get(0).getGradeNm()       != null ? grades.get(0).getGradeNm()       : "";
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "siteId",        siteId,
            "memberGradeId", memberGradeId,
            "gradeNm",       gradeNm
        )));
    }

    /* ─────────────────────────────────────────────────────────────
       주문 시뮬 — 랜덤 판매중 상품 N개 반환
       body: { count: 3, prodStatusCd: "SELLING" }
       응답: { prods: [{ prodId, prodNm, salePrice, prodStock }] }
    ───────────────────────────────────────────────────────────── */
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
        List<Map<String, Object>> prods = all.stream()
            .limit(count)
            .map(p -> Map.<String, Object>of(
                "prodId",    p.getProdId() != null ? p.getProdId() : "",
                "prodNm",    p.getProdNm()    != null ? p.getProdNm()    : "",
                "salePrice", p.getSalePrice() != null ? p.getSalePrice() : 0L,
                "prodStock", p.getProdStock() != null ? p.getProdStock() : 0
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.ok(Map.of("prods", prods)));
    }

    /* ─────────────────────────────────────────────────────────────
       클레임 시뮬 — 주문 ID 기반 클레임 서버사이드 자동 생성
       주문 상세의 orderItems 를 서버에서 직접 읽어 클레임 생성.
       body: {
         orderId,
         claimTypeCd:   "CANCEL",
         reasonCd:      "CHANGE_MIND",
         claimStatusCd: "CLAIM_RECV",
         partialClaim:  true,
         refundRate:    100
       }
       응답: { claimId, claimTypeCd, refundAmt, itemCount }
    ───────────────────────────────────────────────────────────── */
    @PostMapping("/claim/from-order")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> claimFromOrder(
            @RequestBody Map<String, Object> body) {
        String siteId  = SecurityUtil.getSiteIdOrDefault("SITE000001");
        String orderId = body.get("orderId") instanceof String ? (String) body.get("orderId") : null;
        if (orderId == null || orderId.isBlank())
            throw new CmBizException("orderId 가 필요합니다.");

        String typeCd   = body.getOrDefault("claimTypeCd",   "CANCEL").toString();
        String reasonCd = body.getOrDefault("reasonCd",      "CHANGE_MIND").toString();
        String statusCd = body.getOrDefault("claimStatusCd", "CLAIM_RECV").toString();
        boolean partial = Boolean.TRUE.equals(body.get("partialClaim"));
        int refundRate  = body.get("refundRate") instanceof Number
            ? ((Number) body.get("refundRate")).intValue() : 100;

        // 주문 상세 조회 (orderItems 포함)
        OdOrderDto.Item order = odOrderService.getById(orderId);
        List<OdOrderItemDto.Item> items = order.getOrderItems();

        long refundAmt = 0L;

        if (items != null && !items.isEmpty()) {
            // partial=true 면 일부 아이템만 (최소 1개)
            List<OdOrderItemDto.Item> selected = items.stream()
                .filter(it -> !partial || Math.random() > 0.3)
                .toList();
            if (selected.isEmpty()) selected = List.of(items.get(0));

            for (OdOrderItemDto.Item it : selected) {
                int qty = 1;
                if (partial && it.getOrderQty() != null && it.getOrderQty() > 1) {
                    qty = (int) (Math.random() * it.getOrderQty()) + 1;
                } else if (it.getOrderQty() != null) {
                    qty = it.getOrderQty();
                }
                long unitAmt = it.getUnitPrice() != null ? it.getUnitPrice() : 0L;
                refundAmt += unitAmt * qty;
            }
        } else {
            // orderItems 없으면 payAmt 기반
            Long payAmt = order.getPayAmt();
            refundAmt = payAmt != null ? (long) (payAmt * refundRate / 100.0) : 10000L;
        }

        long finalRefund = (long) (refundAmt * refundRate / 100.0);

        OdClaim claim = new OdClaim();
        claim.setSiteId(siteId);
        claim.setOrderId(orderId);
        claim.setClaimTypeCd(typeCd);
        claim.setReasonCd(reasonCd);
        claim.setClaimStatusCd(statusCd);
        claim.setRefundAmt(finalRefund);

        OdClaim saved = odClaimService.create(claim);
        int itemCount = items != null ? items.size() : 0;

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "claimId",     saved.getClaimId(),
            "claimTypeCd", typeCd,
            "refundAmt",   finalRefund,
            "itemCount",   itemCount
        )));
    }
}
