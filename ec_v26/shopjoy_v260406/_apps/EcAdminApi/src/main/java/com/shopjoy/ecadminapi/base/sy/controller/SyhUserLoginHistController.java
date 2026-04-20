package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginHist;
import com.shopjoy.ecadminapi.base.sy.service.SyhUserLoginHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/user-login-hist")
@RequiredArgsConstructor
public class SyhUserLoginHistController {

    private final SyhUserLoginHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhUserLoginHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SyhUserLoginHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhUserLoginHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SyhUserLoginHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhUserLoginHistDto>> getById(@PathVariable String id) {
        SyhUserLoginHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
