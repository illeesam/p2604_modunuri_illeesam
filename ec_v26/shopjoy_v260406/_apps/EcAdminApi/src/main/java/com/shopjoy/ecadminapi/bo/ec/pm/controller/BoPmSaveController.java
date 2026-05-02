package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmSaveService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 적립금 API — /api/bo/ec/pm/save
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/save")
@RequiredArgsConstructor
public class BoPmSaveController {
    private final BoPmSaveService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<PmSaveDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmSaveDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<PmSaveDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveDto>> getById(@PathVariable String id) {
        PmSaveDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PmSave>> create(@RequestBody PmSave body) {
        PmSave result = service.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveDto>> update(@PathVariable String id, @RequestBody PmSave body) {
        PmSaveDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveDto>> upsert(@PathVariable String id, @RequestBody PmSave body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmSave> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
