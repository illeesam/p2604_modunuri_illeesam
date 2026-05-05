package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleConfigService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 정산설정 API — /api/bo/ec/st/config
 */
@RestController
@RequestMapping("/api/bo/ec/st/config")
@RequiredArgsConstructor
public class BoStSettleConfigController {
    private final BoStSettleConfigService boStSettleConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleConfigDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleConfigDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfigDto>> getById(@PathVariable("id") String id) {
        StSettleConfigDto result = boStSettleConfigService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StSettleConfig>> create(@RequestBody StSettleConfig body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettleConfigService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfigDto>> update(@PathVariable("id") String id, @RequestBody StSettleConfig body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfigDto>> upsert(@PathVariable("id") String id, @RequestBody StSettleConfig body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleConfigService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleConfigService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
