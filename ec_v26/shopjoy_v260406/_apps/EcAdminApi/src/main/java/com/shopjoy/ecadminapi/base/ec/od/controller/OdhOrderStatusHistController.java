package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhOrderStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/order-status-hist")
@RequiredArgsConstructor
public class OdhOrderStatusHistController {

    private final OdhOrderStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhOrderStatusHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhOrderStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhOrderStatusHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhOrderStatusHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderStatusHistDto>> getById(@PathVariable String id) {
        OdhOrderStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
