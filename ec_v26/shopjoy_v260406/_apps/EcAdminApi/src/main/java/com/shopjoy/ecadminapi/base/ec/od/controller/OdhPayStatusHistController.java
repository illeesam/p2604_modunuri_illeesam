package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhPayStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/pay-status-hist")
@RequiredArgsConstructor
public class OdhPayStatusHistController {

    private final OdhPayStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhPayStatusHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhPayStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhPayStatusHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhPayStatusHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayStatusHistDto>> getById(@PathVariable String id) {
        OdhPayStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
