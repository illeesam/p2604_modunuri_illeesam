package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 정산 API
 * GET    /api/bo/ec/st/settle       — 목록
 * GET    /api/bo/ec/st/settle/page  — 페이징
 * GET    /api/bo/ec/st/settle/{id}  — 단건
 * POST   /api/bo/ec/st/settle       — 등록
 * PUT    /api/bo/ec/st/settle/{id}  — 수정
 * DELETE /api/bo/ec/st/settle/{id}  — 삭제
 * PATCH  /api/bo/ec/st/settle/{id}/status — 상태변경
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/st/settle")
@RequiredArgsConstructor
@UserOnly
public class BoStSettleController {
    private final BoStSettleService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<StSettleDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<StSettleDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StSettle>> create(@RequestBody StSettle body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleDto>> update(@PathVariable String id, @RequestBody StSettle body) {
        StSettleDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<StSettleDto>> changeStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        StSettleDto result = service.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
