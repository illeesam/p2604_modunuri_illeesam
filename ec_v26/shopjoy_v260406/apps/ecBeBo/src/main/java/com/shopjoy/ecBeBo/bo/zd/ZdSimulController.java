package com.shopjoy.ecBeBo.bo.zd;

import com.shopjoy.ecBeBo.bo.zd.entity.ZdSimulLog;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecBeBo.base.ec.mb.service.MbMemberGradeService;
import com.shopjoy.ecBeBo.base.ec.mb.service.MbMemberService;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecBeBo.base.ec.od.service.OdClaimService;
import com.shopjoy.ecBeBo.base.ec.od.service.OdOrderDiscntService;
import com.shopjoy.ecBeBo.base.ec.od.service.OdOrderItemService;
import com.shopjoy.ecBeBo.base.ec.od.service.OdOrderService;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdStock;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdProdBundleItem;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdProdSetItemService;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdProdBundleItemService;
import com.shopjoy.ecBeBo.base.ec.pd.repository.PdProdImgRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.PdProdOptRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.PdProdSkuRepository;
import com.shopjoy.ecBeBo.base.ec.pd.repository.PdProdStockRepository;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdDlivTmpltService;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdProdOptService;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdProdService;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdProdSkuService;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecBeBo.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecBeBo.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecBeBo.base.ec.pm.service.PmEventService;
import com.shopjoy.ecBeBo.base.ec.pm.service.PmPlanService;
import com.shopjoy.ecBeBo.base.ec.pm.service.PmSaveService;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecBeBo.base.ec.st.service.StErpVoucherService;
import com.shopjoy.ecBeBo.base.ec.st.service.StSettleService;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyVendor;
import com.shopjoy.ecBeBo.base.sy.service.SyUserService;
import com.shopjoy.ecBeBo.base.sy.service.SyVendorService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import com.shopjoy.ecBeBo.common.response.PageResult;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
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
    private final PdProdSkuService     pdProdSkuService;
    private final PdProdImgService     pdProdImgService;
    private final PdProdOptRepository  pdProdOptRepository;
    private final PdProdSkuRepository      pdProdSkuRepository;
    private final PdProdImgRepository      pdProdImgRepository;
    private final PdProdStockRepository    pdProdStockRepository;
    private final PdProdSetItemService        pdProdSetItemService;
    private final PdProdBundleItemService     pdProdBundleItemService;
    private final PdDlivTmpltService   pdDlivTmpltService;
    private final MbMemberService      mbMemberService;
    private final MbMemberGradeService mbMemberGradeService;
    private final OdOrderService       odOrderService;
    private final OdOrderItemService   odOrderItemService;
    private final OdOrderDiscntService odOrderDiscntService;
    private final OdClaimService       odClaimService;
    private final PmEventService       pmEventService;
    private final PmPlanService        pmPlanService;
    private final PmCouponService      pmCouponService;
    private final PmDiscntService      pmDiscntService;
    private final PmSaveService        pmSaveService;
    private final StSettleService      stSettleService;
    private final StErpVoucherService  stErpVoucherService;
    private final SyUserService        syUserService;
    private final SyVendorService      syVendorService;
    private final PasswordEncoder      passwordEncoder;
    private final ZdSimulLogRepository zdSimulLogRepository;

    /* ═══════════════════════════════════════════════════════════
       실행 로그
    ═══════════════════════════════════════════════════════════ */

    /** 로그 목록 조회 (페이징) */
    @GetMapping("/log/page")
    public ResponseEntity<ApiResponse<PageResult<ZdSimulLog>>> logPage(
            @RequestParam Map<String, Object> p) {
        String siteId  = SecurityUtil.getSiteIdOrDefault();
        int pageNo     = p.containsKey("pageNo")   ? Integer.parseInt(p.get("pageNo").toString())   : 1;
        int pageSize   = p.containsKey("pageSize")  ? Integer.parseInt(p.get("pageSize").toString()) : 10;
        String domain  = blankToNull(str(p, "domain",  null));
        String uiNm    = blankToNull(str(p, "uiNm",    null));
        String userNm  = blankToNull(str(p, "userNm",  null));
        String desc    = blankToNull(str(p, "desc",    null));
        String status  = blankToNull(str(p, "status",  null));

        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);
        // [QueryDSL] 시뮬레이터 실행 로그 검색
        Page<ZdSimulLog> page = zdSimulLogRepository.selectPage(siteId, domain, uiNm, userNm, desc, status, pageable);

        PageResult<ZdSimulLog> result = PageResult.of(
            page.getContent(), page.getTotalElements(), pageNo, pageSize, p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 로그 저장 */
    @PostMapping("/log/save")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> logSave(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        /* paramsJson: 프론트가 전송한 실행 파라미터 JSON 문자열을 detail_json 에 그대로 저장 */
        String paramsJson = str(body, "paramsJson", null);
        ZdSimulLog log = ZdSimulLog.builder()
            .logId(CmUtil.generateId("zd_simul_log"))
            .domain(str(body, "domain", "unknown"))
            .simulMode(str(body, "mode", "생성"))
            .simulStatusCd(str(body, "status", "SUCCESS"))
            .descTxt(sanitizeText(str(body, "desc", null)))
            .reasonTxt(sanitizeText(str(body, "reason", null)))
            .targetId(str(body, "targetId", null))
            .userNm(sanitizeText(str(body, "userNm", null)))
            .uiNm(str(body, "uiNm", null))
            .detailJson(paramsJson != null && !paramsJson.isBlank() ? paramsJson : null)
            .build();
        ZdSimulLog saved = zdSimulLogRepository.save(log);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("logId", saved.getLogId())));
    }

    /** 깨진 UTF-8 replacement char(�) 제거 */
    private static String sanitizeText(String s) {
        if (s == null) return null;
        return s.replace("�", "?");
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    /* ═══════════════════════════════════════════════════════════
       DEFAULTS
    ═══════════════════════════════════════════════════════════ */

    @PostMapping("/prod/defaults")
    public ResponseEntity<ApiResponse<Map<String, Object>>> prodDefaults() {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        PdDlivTmpltDto.Request req = new PdDlivTmpltDto.Request();
        List<PdDlivTmpltDto.Item> list = pdDlivTmpltService.getList(req);
        String dlivTmpltId = list.isEmpty() || list.get(0).getDlivTmpltId() == null ? "" : list.get(0).getDlivTmpltId();
        String dlivTmpltNm = list.isEmpty() || list.get(0).getDlivTmpltNm() == null ? "" : list.get(0).getDlivTmpltNm();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "siteId", siteId, "dlivTmpltId", dlivTmpltId, "dlivTmpltNm", dlivTmpltNm)));
    }

    @PostMapping("/member/defaults")
    public ResponseEntity<ApiResponse<Map<String, Object>>> memberDefaults() {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        MbMemberGradeDto.Request req = new MbMemberGradeDto.Request();
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
        String siteId = SecurityUtil.getSiteIdOrDefault();

        /* prodNm 깨짐 방지 */
        if (body.get("prodNm") instanceof String nm) body.put("prodNm", sanitizeText(nm));
        PdProd prod = new PdProd();
        VoUtil.mapCopy(body, prod, "prodOpts", "prodImgs", "prodId");
        prod.setSimulYn("Y");
        /* 프론트 제공 prodId(tmp-prod-01 등) 우선 사용 — 없으면 서비스에서 자동생성 */
        String tmpProdId = str(body, "prodId");
        if (tmpProdId != null && !tmpProdId.isBlank()) prod.setProdId(tmpProdId);

        /* 같은 prodId 재생성 시: 기존 opt/sku/img 먼저 전부 삭제 (누적 방지) */
        if (tmpProdId != null && !tmpProdId.isBlank()) {
            pdProdImgRepository.deleteByProdId(tmpProdId);
            pdProdSkuRepository.deleteByProdId(tmpProdId);
            pdProdOptRepository.deleteByProdId(tmpProdId);
        }

        PdProd saved = pdProdService.create(prod);
        String prodId = saved.getProdId();

        /* 옵션형: prodOpts 처리 — pd_prod 플랫 컬럼 + pd_prod_opt (prod_opt_type_level) */
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> optGroups = body.get("prodOpts") instanceof List
            ? (List<Map<String, Object>>) body.get("prodOpts") : null;

        if (optGroups != null && !optGroups.isEmpty()) {
            List<String> grp1ItemIds = new ArrayList<>();
            List<String> grp2ItemIds = new ArrayList<>();
            /* tmpOptId → 실제 저장된 optId 매핑 (프론트 prodImgs.prodOpt1Id 변환용) */
            Map<String, String> tmpToRealOptId = new java.util.LinkedHashMap<>();

            /* pd_prod 플랫 컬럼 업데이트 (optType1/2 명칭·코드) */
            PdProd prodToUpdate = pdProdService.findById(prodId);
            if (optGroups.size() > 0) {
                Map<String, Object> g0 = optGroups.get(0);
                String cd0 = blankToNull(str(g0, "level1Cd"));
                prodToUpdate.setProdOpt1TypeCd(cd0);
            }
            if (optGroups.size() > 1) {
                Map<String, Object> g1 = optGroups.get(1);
                String cd1 = blankToNull(str(g1, "level1Cd"));
                prodToUpdate.setProdOpt2TypeCd(cd1);
            }
            pdProdService.update(prodId, prodToUpdate);

            int gIdx = 0;
            for (Map<String, Object> grp : optGroups) {
                int level = gIdx + 1;

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> optItems = grp.get("prodOpts") instanceof List
                    ? (List<Map<String, Object>>) grp.get("prodOpts") : List.of();

                for (Map<String, Object> it : optItems) {
                    String tmpOptId = str(it, "prodOptId");
                    PdProdOpt optVal = PdProdOpt.builder()
                        .prodId(prodId)
                        .prodOptTypeLevel(level)
                        .prodOptNm(str(it, "prodOptNm"))
                        .prodOptVal(str(it, "prodOptVal"))
                        .prodOptStyle(str(it, "prodOptStyle"))
                        .sortOrd(intVal(it, "sortOrd", 1))
                        .useYn(str(it, "useYn", "Y"))
                        .build();
                    PdProdOpt savedOptVal = pdProdOptService.create(optVal);
                    String realOptId = savedOptVal.getProdOptId();
                    if (tmpOptId != null && !tmpOptId.isBlank()) tmpToRealOptId.put(tmpOptId, realOptId);
                    if (level == 1) grp1ItemIds.add(realOptId);
                    else grp2ItemIds.add(realOptId);
                }
                gIdx++;
            }

            /* SKU 조합 (그룹1 × 그룹2) */
            if (!grp1ItemIds.isEmpty()) {
                int skuIdx = 0;
                if (grp2ItemIds.isEmpty()) {
                    for (int i = 0; i < grp1ItemIds.size(); i++) {
                        String skuId = "tmp-sku-" + pad2(skuIdx++);
                        PdProdSku sku = PdProdSku.builder()
                            .prodSkuId(skuId)
                            .prodId(prodId)
                            .prodOpt1Id(grp1ItemIds.get(i))
                            .addPrice((long) (i * 1000))
                            .useYn("Y")
                            .build();
                        pdProdSkuService.create(sku);
                        createSimulStockCode(skuId, prodId, siteId, 10);
                    }
                } else {
                    for (int i = 0; i < grp1ItemIds.size(); i++) {
                        for (int j = 0; j < grp2ItemIds.size(); j++) {
                            String skuId = "tmp-sku-" + pad2(skuIdx++);
                            PdProdSku sku = PdProdSku.builder()
                                .prodSkuId(skuId)
                                .prodId(prodId)
                                .prodOpt1Id(grp1ItemIds.get(i))
                                .prodOpt2Id(grp2ItemIds.get(j))
                                .addPrice((long) (i * 1000))
                                .useYn("Y")
                                .build();
                            pdProdSkuService.create(sku);
                            createSimulStockCode(skuId, prodId, siteId, 10);
                        }
                    }
                }
            }

            /* 이미지: 프론트 전송 prodImgs 우선. 없으면 색상별 picsum 폴백 */
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> frontImgs = body.get("prodImgs") instanceof List
                ? (List<Map<String, Object>>) body.get("prodImgs") : null;
            if (frontImgs != null && !frontImgs.isEmpty()) {
                int imgSortOrd = 1;
                for (Map<String, Object> fim : frontImgs) {
                    String url = str(fim, "cdnImgUrl");
                    if (url == null || url.isBlank()) continue;
                    String tmpOpt1 = str(fim, "prodOpt1Id");
                    String realOpt1 = (tmpOpt1 != null) ? tmpToRealOptId.getOrDefault(tmpOpt1, tmpOpt1) : null;
                    PdProdImg img = PdProdImg.builder()
                        .prodId(prodId)
                        .prodOpt1Id(realOpt1)
                        .cdnImgUrl(url)
                        .isThumb(imgSortOrd == 1 ? "Y" : "N")
                        .sortOrd(imgSortOrd++)
                        .build();
                    pdProdImgService.create(img);
                }
            } else {
                /* 폴백: 색상별 picsum */
                for (int i = 0; i < grp1ItemIds.size(); i++) {
                    PdProdImg img = PdProdImg.builder()
                        .prodImgId("tmp-img-" + pad2(i))
                        .prodId(prodId)
                        .prodOpt1Id(grp1ItemIds.get(i))
                        .cdnImgUrl("https://picsum.photos/seed/" + (200 + i * 37) + "/400/400")
                        .isThumb(i == 0 ? "Y" : "N")
                        .sortOrd(i + 1)
                        .build();
                    pdProdImgService.create(img);
                }
            }
        } else {
            /* 단순 상품: prodImgs — 프론트 전송 이미지 목록 (빈 배열이면 기본 picsum 1장 생성) */
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> prodImgs = body.get("prodImgs") instanceof List
                ? (List<Map<String, Object>>) body.get("prodImgs") : null;
            if (prodImgs != null && !prodImgs.isEmpty()) {
                for (int i = 0; i < prodImgs.size(); i++) {
                    PdProdImg img = PdProdImg.builder()
                        .prodId(prodId)
                        .cdnImgUrl(str(prodImgs.get(i), "cdnImgUrl"))
                        .isThumb(i == 0 ? "Y" : "N")
                        .sortOrd(i + 1)
                        .build();
                    pdProdImgService.create(img);
                }
            } else {
                /* 이미지 미전송 시 기본 picsum 1장 */
                PdProdImg img = PdProdImg.builder()
                    .prodId(prodId)
                    .cdnImgUrl("https://picsum.photos/seed/" + Math.abs(prodId.hashCode() % 1000) + "/400/400")
                    .isThumb("Y")
                    .sortOrd(1)
                    .build();
                pdProdImgService.create(img);
            }
        }

        /* ── 세트/묶음 구성상품 저장 ────────────────────────────────────────────
           정책: 세트(SET)·묶음(GROUP) 상품은 구성상품이 반드시 1건 이상 있어야 한다.
                 구성상품 없이 만들면 FO 에서 담을 수 없는 잘못된 상품이 된다.
           정책서: _doc/정책서/ec/pd/pd.02.상품유형-구성요건.md */
        String typeCd = CmUtil.nvlStr(prod.getProdTypeCd());
        if ("SET".equals(typeCd) || "GROUP".equals(typeCd)) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> compItems = body.get("prodCompItems") instanceof List
                ? (List<Map<String, Object>>) body.get("prodCompItems") : List.of();
            if (compItems.isEmpty()) {
                throw new IllegalArgumentException(
                    ("SET".equals(typeCd) ? "세트상품" : "묶음상품")
                    + "은 구성상품이 1건 이상 있어야 합니다. (prodCompItems 누락)");
            }
            int ord = 1;
            for (Map<String, Object> ci : compItems) {
                String itemProdId = str(ci, "itemProdId");
                if (itemProdId == null || itemProdId.isBlank()) continue;
                int qty = ci.get("itemQty") instanceof Number n ? n.intValue() : 1;
                if ("SET".equals(typeCd)) {
                    pdProdSetItemService.create(PdProdSetItem.builder()
                        .setProdId(prodId)
                        .itemProdId(itemProdId)
                        .itemNm(CmUtil.nvlStr(str(ci, "itemNm")))
                        .itemQty(qty)
                        .sortOrd(ord++)
                        .useYn("Y")
                        .build());
                } else {
                    /* price_rate 는 NOT NULL — 구성상품 수로 균등 배분(합계 100) */
                    java.math.BigDecimal rate = java.math.BigDecimal.valueOf(100.0 / compItems.size())
                        .setScale(2, java.math.RoundingMode.HALF_UP);
                    pdProdBundleItemService.create(PdProdBundleItem.builder()
                        .bundleProdId(prodId)
                        .itemProdId(itemProdId)
                        .itemQty(qty)
                        .priceRate(rate)
                        .sortOrd(ord++)
                        .useYn("Y")
                        .build());
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
        String siteId = SecurityUtil.getSiteIdOrDefault();
        int count = body != null && body.get("count") instanceof Number
            ? ((Number) body.get("count")).intValue() : 3;
        PdProdDto.Request req = new PdProdDto.Request();
        if (body != null && body.get("prodStatusCd") instanceof String s && !s.isBlank()) {
            req.setProdStatusCd(s);
        }
        if (body != null && body.get("prodTypeCd") instanceof String t && !t.isBlank()) {
            req.setProdTypeCd(t);
        }
        req.setPageSize(200);
        List<PdProdDto.Item> all = pdProdService.getList(req);
        /* hasOpt 필터: "Y"=옵션있는 상품만, "N"=옵션없는 상품만 */
        if (body != null && body.get("hasOpt") instanceof String ho && !ho.isBlank()) {
            boolean wantOpt = "Y".equalsIgnoreCase(ho);
            all = all.stream()
                .filter(p -> wantOpt
                    ? (p.getProdOpt1TypeCd() != null)
                    : (p.getProdOpt1TypeCd() == null))
                .toList();
        }
        Collections.shuffle(all);

        List<Map<String, Object>> prods = all.stream().limit(count).map(p -> Map.<String, Object>of(
            "prodId",    CmUtil.nvlStr(p.getProdId()),
            "prodNm",    CmUtil.nvlStr(p.getProdNm()),
            "salePrice", p.getSalePrice() != null ? p.getSalePrice() : 0L,
            "prodStock", 0
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
        String siteId = SecurityUtil.getSiteIdOrDefault();
        /* memberNm 깨짐 방지 */
        if (body.get("memberNm") instanceof String nm) body.put("memberNm", sanitizeText(nm));
        OdOrder order = new OdOrder();
        VoUtil.mapCopy(body, order, "orderItems", "promos");
        order.setSimulYn("Y");
        OdOrder saved = odOrderService.create(order);
        String orderId = saved.getOrderId();

        /* 프로모션 처리 */
        @SuppressWarnings("unchecked")
        Map<String, Object> promos = body.get("promos") instanceof Map
            ? (Map<String, Object>) body.get("promos") : null;

        if (promos != null) {
            String couponId      = blankToNull(str(promos, "couponId", null));
            String discntId      = blankToNull(str(promos, "discntId", null));
            long   couponDiscnt  = promos.get("couponDiscntAmt") instanceof Number n ? n.longValue() : 0L;
            long   discntAmt     = promos.get("discntAmt")       instanceof Number n ? n.longValue() : 0L;
            long   saveDeductAmt = promos.get("saveDeductAmt")   instanceof Number n ? n.longValue() : 0L;
            String giftProdId    = blankToNull(str(promos, "giftProdId", null));

            /* 쿠폰 할인 기록 */
            if (couponId != null && couponDiscnt > 0) {
                odOrderDiscntService.create(OdOrderDiscnt.builder()
                    .orderId(orderId)
                    .discntTypeCd("ORDER_COUPON")
                    .couponId(couponId)
                    .discntAmt(couponDiscnt)
                    .build());
            }
            /* 상품 할인 기록 */
            if (discntId != null && discntAmt > 0) {
                odOrderDiscntService.create(OdOrderDiscnt.builder()
                    .orderId(orderId)
                    .discntTypeCd("PROMO_DISCNT")
                    .discntAmt(discntAmt)
                    .build());
            }
            /* 적립금 차감 기록 */
            if (saveDeductAmt > 0) {
                odOrderDiscntService.create(OdOrderDiscnt.builder()
                    .orderId(orderId)
                    .discntTypeCd("SAVE_USE")
                    .discntAmt(saveDeductAmt)
                    .build());
            }
            /* 사은품 — od_order_item에 unit_price=0 행 추가 */
            if (giftProdId != null) {
                odOrderItemService.create(OdOrderItem.builder()
                    .orderId(orderId)
                    .prodId(giftProdId)
                    .orderQty(1)
                    .unitPrice(0L)
                    .itemOrderAmt(0L)
                    .build());
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("orderId", orderId)));
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
        String siteId  = SecurityUtil.getSiteIdOrDefault();
        String orderId = requireStr(body, "orderId");
        String typeCd   = body.getOrDefault("claimTypeCd",   "CANCEL").toString();
        String reasonCd = body.getOrDefault("reasonCd",      "CHANGE_MIND").toString();
        String statusCd = body.getOrDefault("claimStatusCd", "CLAIM_RECV").toString();
        boolean partial = Boolean.TRUE.equals(body.get("partialClaim"));
        int refundRate  = body.get("refundRate") instanceof Number
            ? ((Number) body.get("refundRate")).intValue() : 100;

        OdOrderDto.Item order = odOrderService.getById(orderId);
        List<OdOrderItemDto.Item> items = order.getOrderItems();

        /* 프론트에서 선택한 아이템 목록 */
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> selectedItems = body.get("selectedItems") instanceof List
            ? (List<Map<String, Object>>) body.get("selectedItems") : null;

        long refundAmt = 0L;
        int  itemCount = 0;
        if (selectedItems != null && !selectedItems.isEmpty()) {
            /* 프론트 지정 아이템 사용 */
            Map<String, OdOrderItemDto.Item> itemMap = new java.util.LinkedHashMap<>();
            if (items != null) {
                for (OdOrderItemDto.Item it : items) itemMap.put(it.getOrderItemId(), it);
            }
            for (Map<String, Object> sel : selectedItems) {
                String itemId  = sel.getOrDefault("orderItemId", "").toString();
                int    claimQty = sel.get("claimQty") instanceof Number n ? n.intValue() : 1;
                OdOrderItemDto.Item it = itemMap.get(itemId);
                long unitAmt = (it != null && it.getUnitPrice() != null) ? it.getUnitPrice() : 0L;
                refundAmt += unitAmt * claimQty;
                itemCount++;
            }
        } else if (items != null && !items.isEmpty()) {
            /* 기존 서버 랜덤 로직 */
            List<OdOrderItemDto.Item> selected = items.stream()
                .filter(it -> !partial || Math.random() > 0.3).toList();
            if (selected.isEmpty()) selected = java.util.List.of(items.get(0));
            for (OdOrderItemDto.Item it : selected) {
                int qty = (partial && it.getOrderQty() != null && it.getOrderQty() > 1)
                    ? (int)(Math.random() * it.getOrderQty()) + 1
                    : (it.getOrderQty() != null ? it.getOrderQty() : 1);
                long unitAmt = it.getUnitPrice() != null ? it.getUnitPrice() : 0L;
                refundAmt += unitAmt * qty;
                itemCount++;
            }
        } else {
            Long payAmt = order.getPayAmt();
            refundAmt = payAmt != null ? (long)(payAmt * refundRate / 100.0) : 10000L;
        }

        long finalRefund = (long)(refundAmt * refundRate / 100.0);
        OdClaim claim = OdClaim.builder()
            .orderId(orderId)
            .claimTypeCd(typeCd)
            .reasonCd(reasonCd)
            .claimStatusCd(statusCd)
            .refundAmt(finalRefund)
            .simulYn("Y")
            .build();
        OdClaim saved = odClaimService.create(claim);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "claimId",     saved.getClaimId(),
            "claimTypeCd", typeCd,
            "refundAmt",   finalRefund,
            "itemCount",   itemCount
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
        String siteId = SecurityUtil.getSiteIdOrDefault();
        /* memberNm 깨짐 방지 */
        if (body.get("memberNm") instanceof String nm) body.put("memberNm", sanitizeText(nm));
        MbMember member = new MbMember();
        VoUtil.mapCopy(body, member);
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
        String siteId = SecurityUtil.getSiteIdOrDefault();
        PmEvent event = new PmEvent();
        VoUtil.mapCopy(body, event, "startDate", "endDate");
        event.setSimulYn("Y");
        /* startDate / endDate: 프론트가 "YYYY-MM-DD HH:mm:ss" 형식으로 전송 → LocalDate 변환 */
        event.setStartDate(parseLocalDate(body.get("startDate")));
        event.setEndDate(parseLocalDate(body.get("endDate")));
        if (event.getStartDate() == null) event.setStartDate(LocalDate.now());
        if (event.getEndDate()   == null) event.setEndDate(LocalDate.now().plusDays(7));
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
        String siteId = SecurityUtil.getSiteIdOrDefault();
        PmPlan plan = new PmPlan();
        VoUtil.mapCopy(body, plan, "items", "addProdIds");
        plan.setSimulYn("Y");
        /* planTitle(노출용): 프론트 미전송 시 planNm으로 대체 */
        if (plan.getPlanTitle() == null)
            plan.setPlanTitle(plan.getPlanNm() != null ? plan.getPlanNm() : "시뮬기획전");
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
        String siteId = SecurityUtil.getSiteIdOrDefault();
        PmCoupon coupon = new PmCoupon();
        VoUtil.mapCopy(body, coupon);
        coupon.setSimulYn("Y");
        if (coupon.getCouponTypeCd() == null) coupon.setCouponTypeCd("GENERAL");
        PmCoupon saved = pmCouponService.create(coupon);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("couponId", saved.getCouponId())));
    }

    @PostMapping("/promo/discnt-create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> promoDiscntCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        PmDiscnt discnt = new PmDiscnt();
        VoUtil.mapCopy(body, discnt);
        discnt.setSimulYn("Y");
        PmDiscnt saved = pmDiscntService.create(discnt);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("discntId", saved.getDiscntId())));
    }

    @PostMapping("/promo/save-create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> promoSaveCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        PmSave pmSave = new PmSave();
        VoUtil.mapCopy(body, pmSave);
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
        String siteId = SecurityUtil.getSiteIdOrDefault();
        StSettle settle = new StSettle();
        VoUtil.mapCopy(body, settle, "settleYm");
        settle.setSimulYn("Y");
        /* settleYm: 프론트가 "YYYY-MM" 형식으로 전송 → DB는 "YYYYMM" 6자리 */
        String rawYm = body.get("settleYm") != null ? body.get("settleYm").toString() : null;
        String settleYm = rawYm != null ? rawYm.replace("-", "") : null;
        if (settleYm == null || settleYm.length() != 6)
            settleYm = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        settle.setSettleYm(settleYm);
        /* settleStartDate / settleEndDate: settleYm에서 파생 */
        if (settle.getSettleStartDate() == null || settle.getSettleEndDate() == null) {
            YearMonth ym = YearMonth.parse(settleYm, DateTimeFormatter.ofPattern("yyyyMM"));
            settle.setSettleStartDate(ym.atDay(1).atStartOfDay());
            settle.setSettleEndDate(ym.atEndOfMonth().atTime(23, 59, 59));
        }
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

    /* ═══════════════════════════════════════════════════════════
       사용자(관리자) 시뮬
    ═══════════════════════════════════════════════════════════ */

    /** 관리자 사용자 생성 */
    @PostMapping("/user/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> userCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        SyUser user = new SyUser();
        VoUtil.mapCopy(body, user, "loginPwd");
        String rawPwd = body.get("loginPwd") instanceof String s && !s.isBlank() ? s : "1111";
        user.setLoginPwdHash(passwordEncoder.encode(rawPwd));
        if (user.getUserStatusCd() == null) user.setUserStatusCd("ACTIVE");
        if (body.get("userNm") instanceof String nm) user.setUserNm(sanitizeText(nm));
        SyUser saved = syUserService.create(user);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("userId", saved.getUserId())));
    }

    /** 관리자 사용자 수정 */
    @PostMapping("/user/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> userUpdate(
            @RequestBody Map<String, Object> body) {
        String userId = requireStr(body, "userId");
        SyUser patch = new SyUser();
        VoUtil.mapCopy(body, patch, "userId", "loginPwd");
        syUserService.update(userId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("userId", userId)));
    }

    /* ═══════════════════════════════════════════════════════════
       업체 시뮬
    ═══════════════════════════════════════════════════════════ */

    /** 업체 생성 */
    @PostMapping("/vendor/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> vendorCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        SyVendor vendor = new SyVendor();
        VoUtil.mapCopy(body, vendor);
        if (vendor.getVendorStatusCd() == null) vendor.setVendorStatusCd("ACTIVE");
        if (vendor.getVendorNo() == null || vendor.getVendorNo().isBlank())
            vendor.setVendorNo("SIM" + System.currentTimeMillis() % 100000000L);
        if (body.get("vendorNm") instanceof String nm) vendor.setVendorNm(sanitizeText(nm));
        SyVendor saved = syVendorService.create(vendor);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("vendorId", saved.getVendorId())));
    }

    /** 업체 수정 */
    @PostMapping("/vendor/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> vendorUpdate(
            @RequestBody Map<String, Object> body) {
        String vendorId = requireStr(body, "vendorId");
        SyVendor patch = new SyVendor();
        VoUtil.mapCopy(body, patch, "vendorId");
        syVendorService.update(vendorId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("vendorId", vendorId)));
    }

    /* ═══════════════════════════════════════════════════════════
       ERP 전표 시뮬
    ═══════════════════════════════════════════════════════════ */

    /** ERP 전표 생성 */
    @PostMapping("/voucher/create")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> voucherCreate(
            @RequestBody Map<String, Object> body) {
        String siteId = SecurityUtil.getSiteIdOrDefault();
        StErpVoucher voucher = new StErpVoucher();
        VoUtil.mapCopy(body, voucher);
        if (voucher.getErpVoucherStatusCd() == null) voucher.setErpVoucherStatusCd("DRAFT");
        if (voucher.getVoucherDate() == null) voucher.setVoucherDate(LocalDate.now());
        StErpVoucher saved = stErpVoucherService.create(voucher);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("erpVoucherId", saved.getErpVoucherId())));
    }

    /** ERP 전표 수정 */
    @PostMapping("/voucher/update")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> voucherUpdate(
            @RequestBody Map<String, Object> body) {
        String erpVoucherId = requireStr(body, "erpVoucherId");
        StErpVoucher patch = new StErpVoucher();
        VoUtil.mapCopy(body, patch, "erpVoucherId");
        stErpVoucherService.update(erpVoucherId, patch);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("erpVoucherId", erpVoucherId)));
    }

    /* ─── 헬퍼 ─────────────────────────────────────────────── */

    private static String requireStr(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (!(v instanceof String) || ((String) v).isBlank())
            throw new CmBizException(key + " 가 필요합니다.");
        return (String) v;
    }

    /** 시퀀셜 임시 ID 패딩 — 0→"01", 1→"02" ... */
    private static String pad2(int n) {
        return String.format("%02d", n + 1);
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

    /** "YYYY-MM-DD HH:mm:ss" 또는 "YYYY-MM-DD" 문자열 → LocalDate 변환 */
    private static LocalDate parseLocalDate(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        if (s.isEmpty()) return null;
        try {
            if (s.length() >= 10) return LocalDate.parse(s.substring(0, 10));
        } catch (DateTimeParseException ignored) {}
        return null;
    }

    /** 시뮬용 pd_prod_stock 생성 (stockCode = prodSkuId, 이미 존재하면 재생성하지 않음) */
    private void createSimulStockCode(String prodSkuId, String prodId, String siteId, int stockQty) {
        if (pdProdStockRepository.findByStockCode(prodSkuId).isPresent()) return;
        LocalDateTime now = LocalDateTime.now();
        /* reg/updDate 는 EntitySaveListener 가 서버시각으로 채운다 (여기서 넣어도 덮어씀) */
        PdProdStock sc = PdProdStock.builder()
            .prodStockId("PS" + now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + String.format("%06d", (int)(Math.random() * 1000000)))
            .stockCode(prodSkuId)
            .prodId(prodId)
            .stockQty(stockQty)
            .saleCount(0)
            .regBy("simul")
            .updBy("simul")
            .build();
        pdProdStockRepository.save(sc);
    }
}
