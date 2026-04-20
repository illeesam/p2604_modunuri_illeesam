package com.shopjoy.ecadminapi.bo.ec.dp.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.bo.ec.dp.service.BoDpWidgetService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 전시 위젯 API
 * GET    /api/bo/ec/dp/widget       — 목록
 * GET    /api/bo/ec/dp/widget/page  — 페이징
 * GET    /api/bo/ec/dp/widget/{id}  — 단건
 * POST   /api/bo/ec/dp/widget       — 등록
 * PUT    /api/bo/ec/dp/widget/{id}  — 수정
 * DELETE /api/bo/ec/dp/widget/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/dp/widget")
@RequiredArgsConstructor
@UserOnly
public class BoDpWidgetController {
    private final BoDpWidgetService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpWidgetDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<DpWidgetDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpWidgetDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<DpWidgetDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DpWidget>> create(@RequestBody DpWidget body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpWidgetDto>> update(@PathVariable String id, @RequestBody DpWidget body) {
        DpWidgetDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
