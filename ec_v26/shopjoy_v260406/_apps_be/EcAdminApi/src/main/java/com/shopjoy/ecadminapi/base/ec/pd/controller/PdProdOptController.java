package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-opt")
@RequiredArgsConstructor
public class PdProdOptController {

    private final PdProdOptService service;

    /* 상품 옵션 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOptDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 옵션 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdOptDto.Item>>> list(@Valid @ModelAttribute PdProdOptDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 옵션 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdOptDto.PageResponse>> page(@Valid @ModelAttribute PdProdOptDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 옵션 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdOpt>> create(@RequestBody PdProdOpt entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 옵션 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOpt>> save(@PathVariable("id") String id, @RequestBody PdProdOpt entity) {
        entity.setOptId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 옵션 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOpt>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdOpt entity) {
        entity.setOptId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 옵션 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 옵션 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdOpt> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
