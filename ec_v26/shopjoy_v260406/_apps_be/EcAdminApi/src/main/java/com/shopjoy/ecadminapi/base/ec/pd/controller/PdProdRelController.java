package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdRelDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdRelService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-rel")
@RequiredArgsConstructor
public class PdProdRelController {

    private final PdProdRelService service;

    /* 연관 상품 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdRelDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 연관 상품 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdRelDto.Item>>> list(@Valid @ModelAttribute PdProdRelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 연관 상품 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdRelDto.PageResponse>> page(@Valid @ModelAttribute PdProdRelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 연관 상품 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdRel>> create(@RequestBody PdProdRel entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 연관 상품 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdRel>> save(@PathVariable("id") String id, @RequestBody PdProdRel entity) {
        entity.setProdRelId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 연관 상품 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdRel>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdRel entity) {
        entity.setProdRelId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 연관 상품 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 연관 상품 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdRel> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
