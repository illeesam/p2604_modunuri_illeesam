package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhClaimStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/claim-status-hist")
@RequiredArgsConstructor
public class OdhClaimStatusHistController {

    private final OdhClaimStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimStatusHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhClaimStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhClaimStatusHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhClaimStatusHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimStatusHistDto>> getById(@PathVariable("id") String id) {
        OdhClaimStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
