package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-status-hist")
@RequiredArgsConstructor
public class PdhProdStatusHistController {

    private final PdhProdStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdStatusHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdhProdStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdStatusHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdhProdStatusHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHistDto>> getById(@PathVariable String id) {
        PdhProdStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
