package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhOrderChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/order-chg-hist")
@RequiredArgsConstructor
public class OdhOrderChgHistController {

    private final OdhOrderChgHistService service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhOrderChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhOrderChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhOrderChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhOrderChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderChgHistDto>> getById(@PathVariable("id") String id) {
        OdhOrderChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
