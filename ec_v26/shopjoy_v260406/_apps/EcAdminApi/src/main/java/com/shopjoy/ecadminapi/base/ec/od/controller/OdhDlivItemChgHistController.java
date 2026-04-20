package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhDlivItemChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/dliv-item-chg-hist")
@RequiredArgsConstructor
public class OdhDlivItemChgHistController {

    private final OdhDlivItemChgHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhDlivItemChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhDlivItemChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhDlivItemChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhDlivItemChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivItemChgHistDto>> getById(@PathVariable String id) {
        OdhDlivItemChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
