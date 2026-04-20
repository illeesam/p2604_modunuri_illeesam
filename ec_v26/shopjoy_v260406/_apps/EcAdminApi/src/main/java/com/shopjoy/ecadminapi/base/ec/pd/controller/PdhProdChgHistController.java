package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-chg-hist")
@RequiredArgsConstructor
public class PdhProdChgHistController {

    private final PdhProdChgHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdhProdChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdhProdChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdChgHistDto>> getById(@PathVariable String id) {
        PdhProdChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
