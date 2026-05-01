package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhClaimChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/claim-chg-hist")
@RequiredArgsConstructor
public class OdhClaimChgHistController {

    private final OdhClaimChgHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhClaimChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhClaimChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhClaimChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimChgHistDto>> getById(@PathVariable String id) {
        OdhClaimChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
