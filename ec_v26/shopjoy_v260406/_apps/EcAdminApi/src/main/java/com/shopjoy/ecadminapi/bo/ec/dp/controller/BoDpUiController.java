package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpUiService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 전시 UI API
 * GET    /api/bo/ec/dp/ui       — 목록
 * GET    /api/bo/ec/dp/ui/page  — 페이징
 * GET    /api/bo/ec/dp/ui/{id}  — 단건
 * POST   /api/bo/ec/dp/ui       — 등록
 * PUT    /api/bo/ec/dp/ui/{id}  — 수정
 * DELETE /api/bo/ec/dp/ui/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/ui")
@RequiredArgsConstructor
@UserOnly
public class BoDpUiController {
    private final BoDpUiService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpUiDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<DpUiDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpUiDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<DpUiDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpUi>> create(@RequestBody DpUi body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiDto>> update(@PathVariable String id, @RequestBody DpUi body) {
        DpUiDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
