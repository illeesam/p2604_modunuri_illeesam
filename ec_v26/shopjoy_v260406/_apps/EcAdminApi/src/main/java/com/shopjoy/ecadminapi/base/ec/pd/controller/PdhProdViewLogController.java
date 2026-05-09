package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdViewLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-view-log")
@RequiredArgsConstructor
public class PdhProdViewLogController {

    private final PdhProdViewLogService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdViewLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdViewLogDto.Item>>> list(@Valid @ModelAttribute PdhProdViewLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdViewLogDto.PageResponse>> page(@Valid @ModelAttribute PdhProdViewLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdViewLog>> create(@RequestBody PdhProdViewLog entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdViewLog>> save(@PathVariable("id") String id, @RequestBody PdhProdViewLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdViewLog>> updatePartial(@PathVariable("id") String id, @RequestBody PdhProdViewLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdhProdViewLog> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
