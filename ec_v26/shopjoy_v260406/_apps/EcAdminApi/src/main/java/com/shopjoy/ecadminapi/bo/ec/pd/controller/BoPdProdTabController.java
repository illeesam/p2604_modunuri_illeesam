package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.*;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdContentRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.*;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    @GetMapping("/images")
    public ResponseEntity<ApiResponse<List<PdProdImgDto>>> images(
            @PathVariable("prodId") String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(imgService.getList(p)));
    }

    @GetMapping("/opts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> opts(
            @PathVariable("prodId") String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        List<PdProdOptDto> groups = optService.getList(p);

        Map<String, Object> p2 = new HashMap<>(p);
        List<PdProdOptItemDto> items = optItemService.getList(p2);

        Map<String, Object> result = new HashMap<>();
        result.put("groups", groups);
        result.put("items", items);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/skus")
    public ResponseEntity<ApiResponse<List<PdProdSkuDto>>> skus(
            @PathVariable("prodId") String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(skuService.getList(p)));
    }

    @GetMapping("/contents")
    public ResponseEntity<ApiResponse<List<PdProdContentDto>>> contents(
            @PathVariable("prodId") String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(contentService.getList(p)));
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
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> blocks = (List<Map<String, Object>>) body.getOrDefault("contentBlocks", List.of());
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1) 기존 데이터 전체 삭제 (단순 전체 갱신 패턴)
        pdProdContentRepository.deleteByProdId(prodId);

        // 2) 새 블록 INSERT
        int order = 1;
        for (Map<String, Object> blk : blocks) {
            String type = String.valueOf(blk.getOrDefault("type", "html"));
            String content = String.valueOf(blk.getOrDefault("content", ""));
            String fileName = blk.get("fileName") != null ? String.valueOf(blk.get("fileName")) : null;

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

    @GetMapping("/rels")
    public ResponseEntity<ApiResponse<List<PdProdRelDto>>> rels(
            @PathVariable("prodId") String prodId,
            @RequestParam Map<String, Object> p) {
        p.put("prodId", prodId);
        return ResponseEntity.ok(ApiResponse.ok(relService.getList(p)));
    }
}
