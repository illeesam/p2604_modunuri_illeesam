package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-chg-hist")
@RequiredArgsConstructor
public class PdhProdChgHistController {

    private final PdhProdChgHistService service;

    /* 상품 변경 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 변경 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdChgHistDto.Item>>> list(@Valid @ModelAttribute PdhProdChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 변경 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdChgHistDto.PageResponse>> page(@Valid @ModelAttribute PdhProdChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 변경 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdChgHist>> create(@RequestBody PdhProdChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 변경 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdChgHist>> save(@PathVariable("id") String id, @RequestBody PdhProdChgHist entity) {
        entity.setProdChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 변경 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdChgHist>> updateSelective(@PathVariable("id") String id, @RequestBody PdhProdChgHist entity) {
        entity.setProdChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 변경 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 변경 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdhProdChgHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
