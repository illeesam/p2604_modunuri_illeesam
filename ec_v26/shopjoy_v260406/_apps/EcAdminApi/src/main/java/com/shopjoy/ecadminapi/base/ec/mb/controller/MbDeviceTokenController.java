package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.vo.MbDeviceTokenReq;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbDeviceTokenService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 디바이스 토큰 API
 * GET    /api/base/ec/mb/device-token           — 전체 목록
 * GET    /api/base/ec/mb/device-token/page      — 페이징 목록
 * GET    /api/base/ec/mb/device-token/{id}      — 단건 조회
 * POST   /api/base/ec/mb/device-token           — 등록 (JPA)
 * PUT    /api/base/ec/mb/device-token/{id}      — 전체 수정 (JPA)
 * PATCH  /api/base/ec/mb/device-token/{id}      — 선택 필드 수정 (MyBatis)
 * DELETE /api/base/ec/mb/device-token/{id}      — 삭제 (JPA)
 * POST   /api/base/ec/mb/device-token/save      — _row_status 단건 저장
 * POST   /api/base/ec/mb/device-token/save-list — _row_status 목록 저장
 */
@RestController
@RequestMapping("/api/base/ec/mb/device-token")
@RequiredArgsConstructor
public class MbDeviceTokenController {

    private final MbDeviceTokenService service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbDeviceTokenDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<MbDeviceTokenDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbDeviceTokenDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<MbDeviceTokenDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbDeviceTokenDto>> getById(@PathVariable("id") String id) {
        MbDeviceTokenDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbDeviceToken>> create(@RequestBody MbDeviceToken entity) {
        MbDeviceToken result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** save — 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbDeviceToken>> save(
            @PathVariable("id") String id, @RequestBody MbDeviceToken entity) {
        entity.setDeviceTokenId(id);
        MbDeviceToken result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** update — 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable("id") String id, @RequestBody MbDeviceToken entity) {
        entity.setDeviceTokenId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveByRowStatus — 저장 */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<MbDeviceToken>> saveByRowStatus(@RequestBody @Valid MbDeviceTokenReq req) {
        MbDeviceToken result = service.saveByRowStatus(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** saveListByRowStatus — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<MbDeviceToken>>> saveListByRowStatus(@RequestBody @Valid List<MbDeviceTokenReq> list) {
        List<MbDeviceToken> result = service.saveListByRowStatus(list);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
