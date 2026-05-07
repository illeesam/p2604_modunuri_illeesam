package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhPayChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/pay-chg-hist")
@RequiredArgsConstructor
public class OdhPayChgHistController {

    private final OdhPayChgHistService service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhPayChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhPayChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhPayChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhPayChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayChgHistDto>> getById(@PathVariable("id") String id) {
        OdhPayChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
