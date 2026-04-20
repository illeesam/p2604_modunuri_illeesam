package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.service.OdDlivService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/dliv")
@RequiredArgsConstructor
public class OdDlivController {

    private final OdDlivService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdDlivDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdDlivDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdDlivDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdDlivDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto>> getById(@PathVariable String id) {
        OdDlivDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<OdDliv>> create(@RequestBody OdDliv entity) {
        OdDliv result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDliv>> save(
            @PathVariable String id, @RequestBody OdDliv entity) {
        entity.setDlivId(id);
        OdDliv result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody OdDliv entity) {
        entity.setDlivId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
