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

import java.util.HashMap;
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

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbDeviceTokenDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort) {
        List<MbDeviceTokenDto> result = service.getList(buildParam(siteId, kw, dateStart, dateEnd, sort));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbDeviceTokenDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(required = false) String dateStart,
            @RequestParam(required = false) String dateEnd,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        PageResult<MbDeviceTokenDto> result = service.getPageData(buildParam(siteId, kw, dateStart, dateEnd, sort), pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbDeviceTokenDto>> getById(@PathVariable String id) {
        MbDeviceTokenDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbDeviceToken>> create(@RequestBody MbDeviceToken entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbDeviceToken>> save(
            @PathVariable String id, @RequestBody MbDeviceToken entity) {
        entity.setDeviceTokenId(id);
        MbDeviceToken result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody MbDeviceToken entity) {
        entity.setDeviceTokenId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<MbDeviceToken>> saveByRowStatus(@RequestBody @Valid MbDeviceTokenReq req) {
        MbDeviceToken result = service.saveByRowStatus(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<List<MbDeviceToken>>> saveListByRowStatus(@RequestBody @Valid List<MbDeviceTokenReq> list) {
        List<MbDeviceToken> result = service.saveListByRowStatus(list);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Map<String, Object> buildParam(String siteId, String kw,
                                           String dateStart, String dateEnd, String sort) {
        Map<String, Object> p = new HashMap<>();
        if (siteId    != null) p.put("siteId",    siteId);
        if (kw        != null) p.put("kw",        kw);
        if (dateStart != null) p.put("dateStart", dateStart);
        if (dateEnd   != null) p.put("dateEnd",   dateEnd);
        if (sort      != null) p.put("sort",      sort);
        return p;
    }
}
