package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleConfigService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/st/settle-config")
@RequiredArgsConstructor
public class StSettleConfigController {

    private final StSettleConfigService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleConfigDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<StSettleConfigDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleConfigDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<StSettleConfigDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfigDto>> getById(@PathVariable String id) {
        StSettleConfigDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleConfig>> create(@RequestBody StSettleConfig entity) {
        StSettleConfig result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfig>> save(
            @PathVariable String id, @RequestBody StSettleConfig entity) {
        entity.setSettleConfigId(id);
        StSettleConfig result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody StSettleConfig entity) {
        entity.setSettleConfigId(id);
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
