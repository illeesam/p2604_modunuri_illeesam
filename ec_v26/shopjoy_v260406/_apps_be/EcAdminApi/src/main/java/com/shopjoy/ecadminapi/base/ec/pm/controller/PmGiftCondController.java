package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftCondService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/gift-cond")
@RequiredArgsConstructor
public class PmGiftCondController {

    private final PmGiftCondService service;

    /* 사은품 지급 조건 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftCondDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 사은품 지급 조건 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmGiftCondDto.Item>>> list(@Valid @ModelAttribute PmGiftCondDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 사은품 지급 조건 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmGiftCondDto.PageResponse>> page(@Valid @ModelAttribute PmGiftCondDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 사은품 지급 조건 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmGiftCond>> create(@RequestBody PmGiftCond entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 사은품 지급 조건 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftCond>> save(@PathVariable("id") String id, @RequestBody PmGiftCond entity) {
        entity.setGiftCondId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 사은품 지급 조건 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmGiftCond>> updateSelective(@PathVariable("id") String id, @RequestBody PmGiftCond entity) {
        entity.setGiftCondId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 사은품 지급 조건 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 사은품 지급 조건 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmGiftCond> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
