package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpWidgetLibService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/dp/widget-lib")
@RequiredArgsConstructor
public class DpWidgetLibController {

    private final DpWidgetLibService service;

    /* 전시 위젯 라이브러리 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLibDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 전시 위젯 라이브러리 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpWidgetLibDto.Item>>> list(@Valid @ModelAttribute DpWidgetLibDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 전시 위젯 라이브러리 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpWidgetLibDto.PageResponse>> page(@Valid @ModelAttribute DpWidgetLibDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 전시 위젯 라이브러리 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpWidgetLib>> create(@RequestBody DpWidgetLib entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 전시 위젯 라이브러리 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLib>> save(@PathVariable("id") String id, @RequestBody DpWidgetLib entity) {
        entity.setWidgetLibId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 전시 위젯 라이브러리 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetLib>> updateSelective(@PathVariable("id") String id, @RequestBody DpWidgetLib entity) {
        entity.setWidgetLibId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 전시 위젯 라이브러리 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 전시 위젯 라이브러리 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpWidgetLib> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
