package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdContentChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-content-chg-hist")
@RequiredArgsConstructor
public class PdhProdContentChgHistController {

    private final PdhProdContentChgHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdContentChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdhProdContentChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdContentChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdhProdContentChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdContentChgHistDto>> getById(@PathVariable String id) {
        PdhProdContentChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
