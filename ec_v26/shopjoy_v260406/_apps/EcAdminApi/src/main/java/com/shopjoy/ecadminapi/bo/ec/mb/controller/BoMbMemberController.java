package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemberService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 회원 API
 * GET    /api/bo/ec/mb/member       — 목록
 * GET    /api/bo/ec/mb/member/page  — 페이징
 * GET    /api/bo/ec/mb/member/{id}  — 단건
 * POST   /api/bo/ec/mb/member       — 등록
 * PUT    /api/bo/ec/mb/member/{id}  — 수정
 * DELETE /api/bo/ec/mb/member/{id}  — 삭제
 * PATCH  /api/bo/ec/mb/member/{id}/status — 상태변경
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member")
@RequiredArgsConstructor
@UserOnly
public class BoMbMemberController {
    private final BoMbMemberService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<MbMemberDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbMemberDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<MbMemberDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMember>> create(@RequestBody MbMember body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberDto>> update(@PathVariable String id, @RequestBody MbMember body) {
        MbMemberDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MbMemberDto>> changeStatus(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        MbMemberDto result = service.changeStatus(id, body.get("statusCd"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
