package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginHistDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginHist;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbhMemberLoginHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/mb/member-login-hist")
@RequiredArgsConstructor
public class MbhMemberLoginHistController {

    private final MbhMemberLoginHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbhMemberLoginHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<MbhMemberLoginHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbhMemberLoginHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<MbhMemberLoginHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbhMemberLoginHistDto>> getById(@PathVariable String id) {
        MbhMemberLoginHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
