package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStReconService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 정산대사 API — /api/bo/ec/st/recon
 */
@RestController
@RequestMapping("/api/bo/ec/st/recon")
@RequiredArgsConstructor
public class BoStReconController {
    private final BoStReconService boStReconService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StReconDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StReconDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StReconDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StRecon>> create(@RequestBody StRecon body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStReconService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StReconDto>> update(@PathVariable("id") String id, @RequestBody StRecon body) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStReconService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
