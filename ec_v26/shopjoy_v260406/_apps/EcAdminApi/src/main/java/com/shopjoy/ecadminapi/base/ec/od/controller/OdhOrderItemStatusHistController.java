package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhOrderItemStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/order-item-status-hist")
@RequiredArgsConstructor
public class OdhOrderItemStatusHistController {

    private final OdhOrderItemStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhOrderItemStatusHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhOrderItemStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhOrderItemStatusHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhOrderItemStatusHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderItemStatusHistDto>> getById(@PathVariable String id) {
        OdhOrderItemStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
