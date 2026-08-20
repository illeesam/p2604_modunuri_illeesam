package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdContentRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdImgRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdStock;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSkuRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdStockRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.base.sy.constant.SyAttachRefTableConst;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
/**
 * BO 상품 수정 탭별 조회 API
 *
 * GET /api/bo/ec/pd/prod/{prodId}/images   — 이미지 탭
 * GET /api/bo/ec/pd/prod/{prodId}/opts     — 옵션설정 탭 (옵션그룹 + 옵션값)
 * GET /api/bo/ec/pd/prod/{prodId}/skus     — 옵션(가격/재고) 탭
 * GET /api/bo/ec/pd/prod/{prodId}/contents — 상품설명 탭
 * GET /api/bo/ec/pd/prod/{prodId}/rels     — 연관상품 탭
 */
@RestController
@RequestMapping("/api/bo/ec/pd/prod/{prodId}")
@RequiredArgsConstructor
public class BoPdProdTabController {

    private final PdProdImgService         imgService;
    private final PdProdOptService         optService;
    private final PdProdSkuService         skuService;
    private final PdProdContentService     contentService;
    private final PdProdRelService         relService;
    private final PdProdRepository         pdProdRepository;
    private final PdProdContentRepository  pdProdContentRepository;
    private final PdProdOptRepository      pdProdOptRepository;
    private final PdProdImgRepository      pdProdImgRepository;
    private final PdProdSkuRepository      pdProdSkuRepository;
    private final PdProdStockRepository    pdProdStockRepository;
    private final SyAttachService          syAttachService;

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** images */
    @GetMapping("/images")
    public ResponseEntity<ApiResponse<List<PdProdImgDto.Item>>> images(
            @PathVariable("prodId") String prodId) {
        PdProdImgDto.Request req = new PdProdImgDto.Request();
        req.setProdId(prodId);
        return ResponseEntity.ok(ApiResponse.ok(imgService.getList(req)));
    }

    /** opts — 옵션유형(pd_prod 플랫 컬럼) + 옵션값(pd_prod_opt) */
    @GetMapping("/opts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> opts(
            @PathVariable("prodId") String prodId) {
        PdProd prod = pdProdRepository.findById(prodId).orElse(null);

        // pd_prod 플랫 컬럼 → optTypes 배열로 변환 (프론트 화면 구조와 정합)
        List<Map<String, Object>> optTypes = new ArrayList<>();
        if (prod != null) {
            if (prod.getProdOpt1TypeCd() != null) {
                Map<String, Object> t1 = new HashMap<>();
                t1.put("optTypeCd",    prod.getProdOpt1TypeCd());
                t1.put("optTypeLevel", 1);
                optTypes.add(t1);
            }
            if (prod.getProdOpt2TypeCd() != null) {
                Map<String, Object> t2 = new HashMap<>();
                t2.put("optTypeCd",    prod.getProdOpt2TypeCd());
                t2.put("optTypeLevel", 2);
                optTypes.add(t2);
            }
        }

        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdId(prodId);
        List<PdProdOptDto.Item> opts = optService.getList(optReq);

        Map<String, Object> result = new HashMap<>();
        result.put("optTypes", optTypes);  // [{optTypeCd, optTypeLevel}]
        result.put("opts",     opts);       // 옵션값 목록 (prodOptTypeLevel 로 그룹 구분)
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** skus */
    @GetMapping("/skus")
    public ResponseEntity<ApiResponse<List<PdProdSkuDto.Item>>> skus(
            @PathVariable("prodId") String prodId) {
        PdProdSkuDto.Request req = new PdProdSkuDto.Request();
        req.setProdId(prodId);
        return ResponseEntity.ok(ApiResponse.ok(skuService.getList(req)));
    }

    /**
     * SKU 저장 (전체 교체).
     * body 예: {
     *   "skus": [
     *     { "prodOpt1Id": "PI...", "prodOpt2Id": "PI...", "addPrice": 0, "stockQty": 100, "prodSkuCode": "", "useYn": "Y" },
     *     ...
     *   ]
     * }
     * 처리: 기존 pd_prod_sku 전체 삭제 → 페이로드 순서대로 INSERT.
     *        prodSkuCode 미전달 시 자동 생성 (prodId-001 형식). useYn 미전달 시 "Y".
     *        재고는 pd_prod_stock 에 prodSkuId 로 연결 (upsert).
     */
    @PutMapping("/skus")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateSkus(
            @PathVariable("prodId") String prodId,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> skuRows = body != null && body.get("skus") instanceof List
            ? (List<Map<String, Object>>) body.get("skus") : List.of();
        String siteId = SecurityUtil.getSiteIdOrDefault();
        LocalDateTime now = LocalDateTime.now();

        // 1) 기존 SKU 전체 삭제 (연결된 pd_prod_stock 도 stockCode 기준으로 삭제)
        List<PdProdSku> existingSkus = pdProdSkuRepository.findByProdId(prodId);
        for (PdProdSku existSku : existingSkus) {
            if (existSku.getProdSkuCode() != null) {
                pdProdStockRepository.findByStockCode(existSku.getProdSkuCode())
                    .ifPresent(sc -> pdProdStockRepository.delete(sc));
            }
        }
        pdProdSkuRepository.deleteByProdId(prodId);

        // 2) 신규 INSERT
        int idx = 0;
        for (Map<String, Object> row : skuRows) {
            String skuId = "SK" + now.format(ID_FMT) + String.format("%04d", (int) (Math.random() * 10000)) + idx;
            String skuCode = row.get("prodSkuCode") != null ? String.valueOf(row.get("prodSkuCode")) : "";
            Object addPriceObj = row.get("addPrice");
            String useYn = row.get("useYn") != null ? String.valueOf(row.get("useYn")) : "Y";
            /* 감사컬럼은 EntitySaveListener 가 @PrePersist 에서 주입 */
            PdProdSku sku = PdProdSku.builder()
                .prodSkuId(skuId)
                .prodId(prodId)
                .prodOpt1Id(row.get("prodOpt1Id") != null ? String.valueOf(row.get("prodOpt1Id")) : null)
                .prodOpt2Id(row.get("prodOpt2Id") != null ? String.valueOf(row.get("prodOpt2Id")) : null)
                .prodSkuCode(skuCode.isBlank() ? prodId + "-" + String.format("%03d", idx + 1) : skuCode)
                .addPrice(addPriceObj != null ? Long.parseLong(String.valueOf(addPriceObj)) : 0L)
                .useYn(useYn.isBlank() ? "Y" : useYn)
                .build();
            pdProdSkuRepository.save(sku);

            // pd_prod_stock upsert — stockCode = prodSkuCode
            Object stockObj = row.get("stockQty");
            int stockQty = stockObj != null ? Integer.parseInt(String.valueOf(stockObj)) : 0;
            String stockCode = sku.getProdSkuCode();
            PdProdStock sc = pdProdStockRepository.findByStockCode(stockCode).orElse(null);
            if (sc != null) {
                sc.setStockQty(stockQty);
                pdProdStockRepository.save(sc);
            } else {
                PdProdStock newSc = PdProdStock.builder()
                    .prodStockId("PS" + now.format(ID_FMT) + String.format("%06d", idx))
                    .stockCode(stockCode)
                    .prodId(prodId)
                    .stockQty(stockQty)
                    .saleCount(0)
                    .build();
                pdProdStockRepository.save(newSc);
            }

            idx++;
        }

        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /**
     * 이미지 저장 (전체 교체).
     * body 예: {
     *   "images": [
     *     { "previewUrl": "https://cdn/.../a.jpg", "attachId": "ATT...", "isMain": true,  "prodOpt1Id": "", "prodOpt2Id": "", "imgAltText": "" },
     *     { "previewUrl": "https://ext/.../b.jpg", "attachId": null,     "isMain": false, "prodOpt1Id": "VAL_OCOL_BLACK", "prodOpt2Id": "VAL_OSIZ_M" },
     *     ...
     *   ]
     * }
     * 처리: 기존 pd_prod_img 전체 삭제 → 페이로드 순서대로 INSERT.
     *        attachId 가 있는 행은 sy_attach 에 ref_table_nm=pd_prod_img / ref_id=신규 prodImgId 로 연계.
     *        더 이상 어떤 행에서도 참조되지 않는 기존 attachId 는 sy_attach 에서 정리(물리 삭제)한다
     *        (그렇지 않으면 나중에 ATTACH_CLEANUP 배치가 "미참조"로 오인해 삭제할 위험이 있음 — 2026-08-15).
     */
    @PutMapping("/images")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateImages(
            @PathVariable("prodId") String prodId,
            @Valid @RequestBody PdProdImgUpdateDto.Request req) {
        List<PdProdImgUpdateDto.Row> rows = req != null && req.getImages() != null ? req.getImages() : List.of();
        LocalDateTime now = LocalDateTime.now();

        // 0) 기존(삭제 전) attach_id 수집 — 정리 대상 판별용
        PdProdImgDto.Request imgReq = new PdProdImgDto.Request();
        imgReq.setProdId(prodId);
        List<String> oldAttachIds = imgService.getList(imgReq).stream()
            .map(PdProdImgDto.Item::getAttachId)
            .filter(id -> id != null && !id.isBlank())
            .toList();

        // 1) 기존 데이터 전체 삭제
        pdProdImgRepository.deleteByProdId(prodId);

        // 2) 신규 INSERT + attach 연계
        java.util.Set<String> keptAttachIds = new java.util.HashSet<>();
        int idx = 0;
        for (PdProdImgUpdateDto.Row r : rows) {
            String prodImgId = "PI" + now.format(ID_FMT) + String.format("%04d", (int) (Math.random() * 10000)) + idx;
            if (prodImgId.length() > 21) prodImgId = prodImgId.substring(0, 21);

            String imgUrl = r.getPreviewUrl();
            String thumbUrl = r.getCdnThumbUrl();
            /* 감사컬럼은 EntitySaveListener 가 @PrePersist 에서 주입 */
            PdProdImg img = PdProdImg.builder()
                .prodImgId(prodImgId)
                .prodId(prodId)
                .prodOpt1Id(r.getProdOpt1Id())
                .prodOpt2Id(r.getProdOpt2Id())
                .attachId(r.getAttachId())
                .cdnImgUrl(imgUrl)
                .cdnThumbUrl(thumbUrl != null ? thumbUrl : imgUrl)
                .imgAltText(r.getImgAltText())
                .sortOrd(idx + 1)
                .isThumb(Boolean.TRUE.equals(r.getIsMain()) ? "Y" : "N")
                .build();
            pdProdImgRepository.save(img);

            if (r.getAttachId() != null && !r.getAttachId().isBlank()) {
                keptAttachIds.add(r.getAttachId());
                syAttachService.updateSelective(SyAttach.builder()
                    .attachId(r.getAttachId()).refTableNm(SyAttachRefTableConst.PD_PROD_IMG).refId(prodImgId).build());
            }
            idx++;
        }

        // 3) 더 이상 참조되지 않는 기존 첨부 정리
        for (String oldId : oldAttachIds) {
            if (!keptAttachIds.contains(oldId) && syAttachService.existsById(oldId)) {
                syAttachService.delete(oldId);
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /**
     * 옵션설정 저장 (전체 교체).
     * body 예: {
     *   "optTypes": [{
     *     "_id": 1, "optTypeNm": "색상", "optTypeCd": "COLOR", "optTypeLevel": 1,
     *     "optVals": [{ "_id": 11, "nm": "블랙", "val": "VAL_OCOL_BLACK", "prodOptStyle": "#000000",
     *                   "parentOptId": "", "sortOrd": 1, "useYn": "Y" }, ...]
     *   }, ...]
     * }
     * 처리 순서:
     *   1) pd_prod_opt 전체 삭제
     *   2) pd_prod 의 opt_type1/2 플랫 컬럼 업데이트 (groups[0], groups[1])
     *   3) pd_prod_opt INSERT (prod_opt_type_level = 그룹 인덱스+1)
     * 클라이언트 _id 는 그룹/아이템 식별 임시키 — 부모 매핑(parent_opt_id) 변환에 사용.
     */
    @PutMapping("/opts")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateOpts(
            @PathVariable("prodId") String prodId,
            @Valid @RequestBody PdProdOptUpdateDto.Request req) {
        List<PdProdOptUpdateDto.OptType> groups = req != null && req.getOptTypes() != null ? req.getOptTypes() : List.of();
        String authId = SecurityUtil.getAuthUser().authId();
        String siteId = SecurityUtil.getSiteIdOrDefault();
        LocalDateTime now = LocalDateTime.now();

        // 1) 기존 opt 값 전체 삭제
        pdProdOptRepository.deleteByProdId(prodId);

        // 2) pd_prod 플랫 컬럼 업데이트
        PdProd prod = pdProdRepository.findById(prodId)
            .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다: " + prodId));
        PdProdOptUpdateDto.OptType g0 = groups.size() > 0 ? groups.get(0) : null;
        PdProdOptUpdateDto.OptType g1 = groups.size() > 1 ? groups.get(1) : null;
        prod.setProdOpt1TypeCd(g0 != null ? coalesce(nullIfEmpty(g0.getOptTypeCd()), nullIfEmpty(g0.getLevel1Cd())) : null);
        prod.setProdOpt2TypeCd(g1 != null ? coalesce(nullIfEmpty(g1.getOptTypeCd()), nullIfEmpty(g1.getLevel1Cd())) : null);
        prod.setUpdBy(authId);
        prod.setUpdDate(now);
        pdProdRepository.save(prod);

        // 3) pd_prod_opt INSERT
        // client _id → 신규 opt_id 매핑 (2단 parentOptId 변환용)
        Map<String, String> clientOptIdToOptId = new HashMap<>();
        List<PdProdOpt> optsToInsert = new ArrayList<>();
        List<String[]> optParentLinks = new ArrayList<>();

        int gIdx = 0;
        for (PdProdOptUpdateDto.OptType g : groups) {
            int level = gIdx + 1;
            List<PdProdOptUpdateDto.OptVal> items = g.getOptVals() != null ? g.getOptVals() : List.of();
            int iIdx = 0;
            for (PdProdOptUpdateDto.OptVal it : items) {
                String iClientId = String.valueOf(it.get_id() != null ? it.get_id() : "");
                String optId = "PV" + now.format(ID_FMT) + String.format("%04d", (int) (Math.random() * 10000)) + gIdx + iIdx;
                if (optId.length() > 21) optId = optId.substring(0, 21);
                clientOptIdToOptId.put(iClientId, optId);

                /* 감사컬럼은 EntitySaveListener 가 @PrePersist 에서 주입 */
                PdProdOpt opt = PdProdOpt.builder()
                    .prodOptId(optId)
                    .prodId(prodId)
                    .prodOptTypeLevel(level)
                    .prodOptNm(CmUtil.nvlStr(it.getNm()))
                    .prodOptVal(CmUtil.nvlStr(it.getVal()))
                    .prodOptStdCd(nullIfEmpty(it.getStdCd()))
                    .prodOptStyle(nullIfEmpty(it.getProdOptStyle()))
                    .sortOrd(it.getSortOrd() != null ? it.getSortOrd() : (iIdx + 1))
                    .useYn(it.getUseYn() != null && !it.getUseYn().isEmpty() ? it.getUseYn() : "Y")
                    .build();
                String parentClient = it.getParentOptId() != null ? String.valueOf(it.getParentOptId()) : null;
                if (parentClient != null && parentClient.isEmpty()) parentClient = null;
                optsToInsert.add(opt);
                optParentLinks.add(new String[] { optId, parentClient });
                iIdx++;
            }
            gIdx++;
        }

        // parent client _id → 신규 opt_id 변환 후 INSERT
        for (int i = 0; i < optsToInsert.size(); i++) {
            PdProdOpt opt = optsToInsert.get(i);
            String parentClient = optParentLinks.get(i)[1];
            if (parentClient != null && !parentClient.isEmpty()) {
                String parentOptId = clientOptIdToOptId.get(parentClient);
                if (parentOptId != null) opt.setParentProdOptId(parentOptId);
            }
            pdProdOptRepository.save(opt);
        }

        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** nullIfEmpty — 빈 문자열을 null로 정규화 */
    private static String nullIfEmpty(String s) {
        return (s == null || s.isEmpty()) ? null : s;
    }

    /** coalesce — 첫 번째 non-null 값 반환 */
    private static String coalesce(String a, String b) {
        return a != null ? a : b;
    }

    /** contents */
    @GetMapping("/contents")
    public ResponseEntity<ApiResponse<List<PdProdContentDto.Item>>> contents(
            @PathVariable("prodId") String prodId) {
        PdProdContentDto.Request req = new PdProdContentDto.Request();
        req.setProdId(prodId);
        return ResponseEntity.ok(ApiResponse.ok(contentService.getList(req)));
    }

    /**
     * 상품설명 블록 일괄 저장.
     * 프론트가 보낸 contentBlocks 를 기준으로 기존 데이터 전체 삭제 후 재등록.
     * body 예: { "contentBlocks": [{ "type":"file", "content":"https://cdn/..." }, ...] }
     * ⚠️ file 타입 블록이 올린 sy_attach 는 **의도적으로 ref_table_nm/ref_id 를 연계하지 않는다.**
     *    pd_prod_content 는 저장마다 행이 새 ID로 재생성돼 어떤 파일이 "지금 쓰이는 것"인지
     *    행 단위로 신뢰성 있게 추적할 수 없어(§10-B), 제거/교체된 옛 첨부를 여기서 정리(delete)할
     *    방법이 없다. 이 상태에서 ref_table_nm 을 채워버리면 오히려 더 나쁘다 — "연계됨(미참조 아님)"
     *    으로 보여서 향후 ATTACH_CLEANUP 배치(30일 이상 미참조 정리)의 스윕 대상에서도 영원히
     *    제외되어 버린다(정리하는 코드도 없고, 배치도 못 건드리는 상태로 영구 방치). 그래서 이 파일들은
     *    **처음부터 미연계 상태로 남겨** ATTACH_CLEANUP 배치가 유일한 정리 주체가 되도록 한다.
     */
    @PutMapping("/contents")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateContents(
            @PathVariable("prodId") String prodId,
            @Valid @RequestBody PdProdContentUpdateDto.Request req) {
        List<PdProdContentUpdateDto.Block> blocks = req != null && req.getContentBlocks() != null ? req.getContentBlocks() : List.of();
        LocalDateTime now = LocalDateTime.now();

        // 1) 기존 데이터 전체 삭제 (단순 전체 갱신 패턴)
        pdProdContentRepository.deleteByProdId(prodId);

        // 2) 새 블록 INSERT (첨부 연계는 하지 않음 — 위 설명 참조)
        int order = 1;
        for (PdProdContentUpdateDto.Block blk : blocks) {
            String type = blk.getType() != null ? blk.getType() : "html";
            String content = CmUtil.nvlStr(blk.getContent());

            /* 감사컬럼은 EntitySaveListener 가 @PrePersist 에서 주입 */
            PdProdContent entity = PdProdContent.builder()
                .prodContentId("PC" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)))
                .prodId(prodId)
                .contentTypeCd(type.toUpperCase())   // HTML / IMAGE / URL 등
                .contentHtml(content)
                .sortOrd(order++)
                .useYn("Y")
                .build();
            pdProdContentRepository.save(entity);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /**
     * 상품설명 블록 정렬순서만 즉시 저장.
     * body 예: { "list": [{ "id": "PC...", "sortOrd": 1 }, { "id": "PC...", "sortOrd": 2 }, ...] }
     * 본문(content) 등 미저장 편집은 건드리지 않음.
     */
    @PatchMapping("/contents/sort")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateContentsSort(
            @PathVariable("prodId") String prodId,
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> list = body != null && body.get("list") instanceof List
            ? (List<Map<String, Object>>) body.get("list") : List.of();
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        for (Map<String, Object> row : list) {
            if (row == null) { continue; }
            Object idObj = row.get("id");
            Object sortObj = row.get("sortOrd");
            if (idObj == null || sortObj == null) { continue; }
            String id = String.valueOf(idObj);
            if (id.isBlank()) { continue; }
            int sortOrd;
            try { sortOrd = Integer.parseInt(String.valueOf(sortObj)); } catch (Exception e) { continue; }
            PdProdContent entity = pdProdContentRepository.findById(id).orElse(null);
            if (entity == null) { continue; }
            if (!prodId.equals(entity.getProdId())) { continue; }
            if (entity.getSortOrd() == null || entity.getSortOrd() != sortOrd) {
                entity.setSortOrd(sortOrd);
                entity.setUpdBy(authId);
                entity.setUpdDate(now);
                pdProdContentRepository.save(entity);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "순서가 저장되었습니다."));
    }

    /** rels */
    @GetMapping("/rels")
    public ResponseEntity<ApiResponse<List<PdProdRelDto.Item>>> rels(
            @PathVariable("prodId") String prodId) {
        PdProdRelDto.Request req = new PdProdRelDto.Request();
        req.setProdId(prodId);
        return ResponseEntity.ok(ApiResponse.ok(relService.getList(req)));
    }
}
