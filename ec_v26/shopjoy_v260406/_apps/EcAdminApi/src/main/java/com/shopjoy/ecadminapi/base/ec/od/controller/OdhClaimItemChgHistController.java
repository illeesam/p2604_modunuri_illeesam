package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhClaimItemChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/od/claim-item-chg-hist")
@RequiredArgsConstructor
public class OdhClaimItemChgHistController {

    private final OdhClaimItemChgHistService service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimItemChgHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<OdhClaimItemChgHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdhClaimItemChgHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<OdhClaimItemChgHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemChgHistDto>> getById(@PathVariable("id") String id) {
        OdhClaimItemChgHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
