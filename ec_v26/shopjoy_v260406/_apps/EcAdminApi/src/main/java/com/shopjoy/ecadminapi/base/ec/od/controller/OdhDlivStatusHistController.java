package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhDlivStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/dliv-status-hist")
@RequiredArgsConstructor
public class OdhDlivStatusHistController {

    private final OdhDlivStatusHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhDlivStatusHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhDlivStatusHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhDlivStatusHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhDlivStatusHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivStatusHistDto>> getById(@PathVariable String id) {
        OdhDlivStatusHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
