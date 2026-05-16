package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-status-hist")
@RequiredArgsConstructor
public class PdhProdStatusHistController {

    private final PdhProdStatusHistService service;

    /* 상품 상태 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 상태 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdStatusHistDto.Item>>> list(@Valid @ModelAttribute PdhProdStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 상태 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdStatusHistDto.PageResponse>> page(@Valid @ModelAttribute PdhProdStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 상태 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdStatusHist>> create(@RequestBody PdhProdStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 상태 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHist>> save(@PathVariable("id") String id, @RequestBody PdhProdStatusHist entity) {
        entity.setProdStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 상태 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHist>> updateSelective(@PathVariable("id") String id, @RequestBody PdhProdStatusHist entity) {
        entity.setProdStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 상태 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 상태 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdhProdStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
