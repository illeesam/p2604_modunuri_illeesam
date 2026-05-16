package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdQnaDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdQnaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-qna")
@RequiredArgsConstructor
public class PdProdQnaController {

    private final PdProdQnaService service;

    /* 상품 문의 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdQnaDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 문의 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdQnaDto.Item>>> list(@Valid @ModelAttribute PdProdQnaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 문의 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdQnaDto.PageResponse>> page(@Valid @ModelAttribute PdProdQnaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 문의 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdQna>> create(@RequestBody PdProdQna entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 문의 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdQna>> save(@PathVariable("id") String id, @RequestBody PdProdQna entity) {
        entity.setQnaId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 상품 문의 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdQna>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdQna entity) {
        entity.setQnaId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 문의 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 상품 문의 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdQna> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
