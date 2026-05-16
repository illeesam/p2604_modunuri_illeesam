package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpUiService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/dp/ui")
@RequiredArgsConstructor
public class DpUiController {

    private final DpUiService service;

    /* 전시 UI 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 전시 UI 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpUiDto.Item>>> list(@Valid @ModelAttribute DpUiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 전시 UI 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpUiDto.PageResponse>> page(@Valid @ModelAttribute DpUiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 전시 UI 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpUi>> create(@RequestBody DpUi entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 전시 UI 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUi>> save(@PathVariable("id") String id, @RequestBody DpUi entity) {
        entity.setUiId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 전시 UI 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUi>> updateSelective(@PathVariable("id") String id, @RequestBody DpUi entity) {
        entity.setUiId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 전시 UI 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 전시 UI 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpUi> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
