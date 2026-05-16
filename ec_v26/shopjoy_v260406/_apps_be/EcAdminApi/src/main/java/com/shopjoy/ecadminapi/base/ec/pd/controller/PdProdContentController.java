package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdContentService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-content")
@RequiredArgsConstructor
public class PdProdContentController {

    private final PdProdContentService service;

    /* 상품 상세 콘텐츠 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdContentDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 상세 콘텐츠 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdContentDto.Item>>> list(@Valid @ModelAttribute PdProdContentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 상세 콘텐츠 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdContentDto.PageResponse>> page(@Valid @ModelAttribute PdProdContentDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 상세 콘텐츠 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdContent>> create(@RequestBody PdProdContent entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 상세 콘텐츠 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdContent>> save(@PathVariable("id") String id, @RequestBody PdProdContent entity) {
        entity.setProdContentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 상세 콘텐츠 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdContent>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdContent entity) {
        entity.setProdContentId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 상세 콘텐츠 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 상세 콘텐츠 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdContent> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
