package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdContentRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdImgRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptItemRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdOptRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.validation.Valid;
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

    private final PdProdImgService     imgService;
    private final PdProdOptService     optService;
    private final PdProdOptItemService optItemService;
    private final PdProdSkuService     skuService;
    private final PdProdContentService contentService;
    private final PdProdRelService     relService;
    private final PdProdContentRepository pdProdContentRepository;
    private final PdProdOptRepository pdProdOptRepository;
    private final PdProdOptItemRepository pdProdOptItemRepository;
    private final PdProdImgRepository pdProdImgRepository;

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** images */
    @GetMapping("/images")
    public ResponseEntity<ApiResponse<List<PdProdImgDto.Item>>> images(
            @PathVariable("prodId") String prodId) {
        PdProdImgDto.Request req = new PdProdImgDto.Request();
        req.setProdId(prodId);
        return ResponseEntity.ok(ApiResponse.ok(imgService.getList(req)));
    }

    /** opts */
    @GetMapping("/opts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> opts(
            @PathVariable("prodId") String prodId) {
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdId(prodId);
        List<PdProdOptDto.Item> groups = optService.getList(optReq);

        PdProdOptItemDto.Request optItemReq = new PdProdOptItemDto.Request();
        optItemReq.setProdId(prodId);
        List<PdProdOptItemDto.Item> items = optItemService.getList(optItemReq);

        Map<String, Object> result = new HashMap<>();
        result.put("groups", groups);
        result.put("items", items);
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
     * 이미지 저장 (전체 교체).
     * body 예: {
     *   "images": [
     *     { "previewUrl": "data:image/png;base64,...", "isMain": true,  "optItemId1": "", "optItemId2": "", "imgAltText": "" },
     *     { "previewUrl": "https://cdn/.../a.jpg",     "isMain": false, "optItemId1": "VAL_OCOL_BLACK", "optItemId2": "VAL_OSIZ_M" },
     *     ...
     *   ]
     * }
     * 처리: 기존 pd_prod_img 전체 삭제 → 페이로드 순서대로 INSERT.
     *        previewUrl 의 prefix 가 "http" 면 cdn_img_url, 아니면 그대로 cdn_img_url 에 저장 (Base64 등).
     */
    @PutMapping("/images")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateImages(
            @PathVariable("prodId") String prodId,
            @RequestBody PdProdImgUpdateDto.Request req) {
        List<PdProdImgUpdateDto.Row> rows = req != null && req.getImages() != null ? req.getImages() : List.of();
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1) 기존 데이터 전체 삭제
        pdProdImgRepository.deleteByProdId(prodId);

        // 2) 신규 INSERT
        int idx = 0;
        for (PdProdImgUpdateDto.Row r : rows) {
            String prodImgId = "PI" + now.format(ID_FMT) + String.format("%04d", (int) (Math.random() * 10000)) + idx;
            if (prodImgId.length() > 21) prodImgId = prodImgId.substring(0, 21);

            PdProdImg img = new PdProdImg();
            img.setProdImgId(prodImgId);
            img.setProdId(prodId);
            img.setOptItemId1(r.getOptItemId1());
            img.setOptItemId2(r.getOptItemId2());
            String imgUrl = r.getPreviewUrl();
            String thumbUrl = r.getCdnThumbUrl();
            img.setCdnImgUrl(imgUrl);
            img.setCdnThumbUrl(thumbUrl != null ? thumbUrl : imgUrl);
            img.setImgAltText(r.getImgAltText());
            img.setSortOrd(idx + 1);
            img.setIsThumb(Boolean.TRUE.equals(r.getIsMain()) ? "Y" : "N");
            img.setRegBy(authId);
            img.setRegDate(now);
            img.setUpdBy(authId);
            img.setUpdDate(now);
            pdProdImgRepository.save(img);
            idx++;
        }

        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /**
     * 옵션설정 저장 (전체 교체).
     * body 예: {
     *   "optGroups": [{
     *     "_id": 1, "grpNm": "색상", "typeCd": "TYPE_OUTER_COLOR", "inputTypeCd": "SELECT", "level": 1,
     *     "items": [{ "_id": 11, "nm": "블랙", "val": "VAL_OCOL_BLACK", "valCodeId": "CD000963",
     *                 "parentOptItemId": "", "sortOrd": 1, "useYn": "Y" }, ...]
     *   }, ...]
     * }
     * 처리 순서: 기존 item 전체 삭제 → 기존 opt 전체 삭제 → opt INSERT → item INSERT.
     * 클라이언트 _id 는 그룹/아이템 식별 임시키 — 부모 매핑(parent_opt_item_id) 변환에 사용.
     */
    @PutMapping("/opts")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateOpts(
            @PathVariable("prodId") String prodId,
            @RequestBody PdProdOptUpdateDto.Request req) {
        List<PdProdOptUpdateDto.Group> groups = req != null && req.getOptGroups() != null ? req.getOptGroups() : List.of();
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1) 기존 데이터 삭제 (item → opt 순)
        List<PdProdOpt> existingOpts = pdProdOptRepository.findByProdId(prodId);
        if (!existingOpts.isEmpty()) {
            List<String> oldOptIds = new ArrayList<>();
            for (PdProdOpt o : existingOpts) oldOptIds.add(o.getOptId());
            pdProdOptItemRepository.deleteByOptIdIn(oldOptIds);
        }
        pdProdOptRepository.deleteByProdId(prodId);

        // 2) 신규 INSERT — clientId(group._id) → 신규 opt_id 매핑
        Map<String, String> clientIdToOptId = new HashMap<>();
        // 신규 item 의 client _id → 신규 opt_item_id 매핑 (parent 변환용)
        Map<String, String> clientItemIdToItemId = new HashMap<>();
        // item INSERT 는 parent 매핑이 끝난 뒤에 일괄 처리하기 위해 모아둔다
        List<PdProdOptItem> itemsToInsert = new ArrayList<>();
        // (item, parentClientId) 쌍 — 1차 INSERT 후 parent_opt_item_id 를 채움
        List<String[]> itemParentLinks = new ArrayList<>();

        int gIdx = 0;
        for (PdProdOptUpdateDto.Group g : groups) {
            String gClientId = String.valueOf(g.get_id() != null ? g.get_id() : "");
            int level    = g.getLevel() != null ? g.getLevel() : (gIdx + 1);
            String typeCd = nullIfEmpty(g.getTypeCd());
            // grpNm 은 NOT NULL — 비어있으면 typeCd 또는 "옵션N" 으로 fallback
            String grpNm = nullIfEmpty(g.getGrpNm());
            if (grpNm == null) grpNm = (typeCd != null ? typeCd : "옵션" + (gIdx + 1));
            String inputCd = g.getInputTypeCd() != null && !g.getInputTypeCd().isEmpty() ? g.getInputTypeCd() : "SELECT";

            String optId = "PO" + now.format(ID_FMT) + String.format("%04d", (int) (Math.random() * 10000)) + gIdx;
            if (optId.length() > 21) optId = optId.substring(0, 21);
            clientIdToOptId.put(gClientId, optId);

            PdProdOpt opt = new PdProdOpt();
            opt.setOptId(optId);
            opt.setProdId(prodId);
            opt.setOptGrpNm(grpNm);
            opt.setOptLevel(level);
            opt.setOptTypeCd(typeCd);
            opt.setOptInputTypeCd(inputCd);
            opt.setSortOrd(gIdx + 1);
            opt.setRegBy(authId);
            opt.setRegDate(now);
            opt.setUpdBy(authId);
            opt.setUpdDate(now);
            pdProdOptRepository.save(opt);

            List<PdProdOptUpdateDto.Item> items = g.getItems() != null ? g.getItems() : List.of();
            int iIdx = 0;
            for (PdProdOptUpdateDto.Item it : items) {
                String iClientId = String.valueOf(it.get_id() != null ? it.get_id() : "");
                String optItemId = "PI" + now.format(ID_FMT) + String.format("%04d", (int) (Math.random() * 10000)) + gIdx + "_" + iIdx;
                if (optItemId.length() > 21) optItemId = optItemId.substring(0, 21);
                clientItemIdToItemId.put(iClientId, optItemId);

                PdProdOptItem item = new PdProdOptItem();
                item.setOptItemId(optItemId);
                item.setOptId(optId);
                item.setOptTypeCd(typeCd);
                item.setOptNm(it.getNm() != null ? it.getNm() : "");
                item.setOptVal(it.getVal() != null ? it.getVal() : "");
                item.setOptValCodeId(nullIfEmpty(it.getValCodeId()));
                item.setSortOrd(it.getSortOrd() != null ? it.getSortOrd() : (iIdx + 1));
                item.setUseYn(it.getUseYn() != null && !it.getUseYn().isEmpty() ? it.getUseYn() : "Y");
                item.setRegBy(authId);
                item.setRegDate(now);
                item.setUpdBy(authId);
                item.setUpdDate(now);
                // parent 임시 보관 (1단=비어있음, 2단=1단 client _id)
                String parentClient = it.getParentOptItemId() != null ? String.valueOf(it.getParentOptItemId()) : null;
                if (parentClient != null && parentClient.isEmpty()) parentClient = null;
                itemsToInsert.add(item);
                itemParentLinks.add(new String[] { optItemId, parentClient });
                iIdx++;
            }
            gIdx++;
        }

        // 3) 부모 client _id → 신규 opt_item_id 변환 후 INSERT
        for (int i = 0; i < itemsToInsert.size(); i++) {
            PdProdOptItem item = itemsToInsert.get(i);
            String parentClient = itemParentLinks.get(i)[1];
            if (parentClient != null && !parentClient.isEmpty()) {
                String parentItemId = clientItemIdToItemId.get(parentClient);
                if (parentItemId != null) item.setParentOptItemId(parentItemId);
            }
            pdProdOptItemRepository.save(item);
        }

        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** nullIfEmpty — 빈 문자열을 null로 정규화 */
    private static String nullIfEmpty(String s) {
        return (s == null || s.isEmpty()) ? null : s;
    }

    /** strOrNull */
    private static String strOrNull(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o);
        return s.isEmpty() ? null : s;
    }
    /** strOrEmpty */
    private static String strOrEmpty(Object o, String dflt) {
        if (o == null) return dflt;
        String s = String.valueOf(o);
        return s.isEmpty() ? dflt : s;
    }
    /** toInt — 변환 */
    private static Integer toInt(Object o, int dflt) {
        if (o == null) return dflt;
        try { return Integer.parseInt(String.valueOf(o)); } catch (Exception e) { return dflt; }
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
     * body 예: { "contentBlocks": [{ "type":"html", "content":"<p>...</p>" }, ...] }
     */
    @PutMapping("/contents")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> updateContents(
            @PathVariable("prodId") String prodId,
            @RequestBody PdProdContentUpdateDto.Request req) {
        List<PdProdContentUpdateDto.Block> blocks = req != null && req.getContentBlocks() != null ? req.getContentBlocks() : List.of();
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1) 기존 데이터 전체 삭제 (단순 전체 갱신 패턴)
        pdProdContentRepository.deleteByProdId(prodId);

        // 2) 새 블록 INSERT
        int order = 1;
        for (PdProdContentUpdateDto.Block blk : blocks) {
            String type = blk.getType() != null ? blk.getType() : "html";
            String content = blk.getContent() != null ? blk.getContent() : "";

            PdProdContent entity = new PdProdContent();
            entity.setProdContentId("PC" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            entity.setProdId(prodId);
            entity.setContentTypeCd(type.toUpperCase()); // HTML / IMAGE / URL 등
            entity.setContentHtml(content);
            entity.setSortOrd(order++);
            entity.setUseYn("Y");
            entity.setRegBy(authId);
            entity.setRegDate(now);
            entity.setUpdBy(authId);
            entity.setUpdDate(now);
            pdProdContentRepository.save(entity);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
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
