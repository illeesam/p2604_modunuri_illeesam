package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhDlivChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/dliv-chg-hist")
@RequiredArgsConstructor
public class OdhDlivChgHistController {

    private final OdhDlivChgHistService service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhDlivChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhDlivChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhDlivChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhDlivChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivChgHistDto>> getById(@PathVariable("id") String id) {
        OdhDlivChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
