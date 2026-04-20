package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhClaimItemStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/claim-item-status-hist")
@RequiredArgsConstructor
public class OdhClaimItemStatusHistController {

    private final OdhClaimItemStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimItemStatusHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhClaimItemStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhClaimItemStatusHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhClaimItemStatusHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHistDto>> getById(@PathVariable String id) {
        OdhClaimItemStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
