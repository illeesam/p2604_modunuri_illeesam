package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpAreaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/dp/area")
@RequiredArgsConstructor
public class DpAreaController {

    private final DpAreaService service;

    /* 전시 영역 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpAreaDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 전시 영역 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpAreaDto.Item>>> list(@Valid @ModelAttribute DpAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 전시 영역 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpAreaDto.PageResponse>> page(@Valid @ModelAttribute DpAreaDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 전시 영역 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpArea>> create(@RequestBody DpArea entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 전시 영역 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpArea>> save(@PathVariable("id") String id, @RequestBody DpArea entity) {
        entity.setAreaId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 전시 영역 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DpArea>> updateSelective(@PathVariable("id") String id, @RequestBody DpArea entity) {
        entity.setAreaId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 전시 영역 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 전시 영역 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpArea> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
