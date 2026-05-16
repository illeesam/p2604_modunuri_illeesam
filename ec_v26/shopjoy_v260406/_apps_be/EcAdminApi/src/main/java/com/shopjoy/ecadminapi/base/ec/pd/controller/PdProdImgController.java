package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-img")
@RequiredArgsConstructor
public class PdProdImgController {

    private final PdProdImgService service;

    /* 상품 이미지 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImgDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 이미지 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdImgDto.Item>>> list(@Valid @ModelAttribute PdProdImgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 이미지 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdImgDto.PageResponse>> page(@Valid @ModelAttribute PdProdImgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 이미지 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdImg>> create(@RequestBody PdProdImg entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 이미지 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImg>> save(@PathVariable("id") String id, @RequestBody PdProdImg entity) {
        entity.setProdImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 이미지 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImg>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdImg entity) {
        entity.setProdImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 이미지 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 이미지 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdImg> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
