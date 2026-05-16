package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpUiAreaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/dp/ui-area")
@RequiredArgsConstructor
public class DpUiAreaController {

    private final DpUiAreaService service;

    /* 전시 UI-영역 매핑 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiAreaDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 전시 UI-영역 매핑 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpUiAreaDto.Item>>> list(@Valid @ModelAttribute DpUiAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 전시 UI-영역 매핑 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpUiAreaDto.PageResponse>> page(@Valid @ModelAttribute DpUiAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 전시 UI-영역 매핑 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpUiArea>> create(@RequestBody DpUiArea entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 전시 UI-영역 매핑 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiArea>> save(@PathVariable("id") String id, @RequestBody DpUiArea entity) {
        entity.setUiAreaId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 전시 UI-영역 매핑 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiArea>> updateSelective(@PathVariable("id") String id, @RequestBody DpUiArea entity) {
        entity.setUiAreaId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 전시 UI-영역 매핑 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 전시 UI-영역 매핑 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpUiArea> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
