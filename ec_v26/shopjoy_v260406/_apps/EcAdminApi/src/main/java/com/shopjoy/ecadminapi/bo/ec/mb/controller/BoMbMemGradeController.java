package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemGradeService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 회원등급 API
 * GET    /api/bo/ec/mb/mem-grade       — 목록
 * GET    /api/bo/ec/mb/mem-grade/page  — 페이징
 * GET    /api/bo/ec/mb/mem-grade/{id}  — 단건
 * POST   /api/bo/ec/mb/mem-grade       — 등록
 * PUT    /api/bo/ec/mb/mem-grade/{id}  — 수정
 * DELETE /api/bo/ec/mb/mem-grade/{id}  — 삭제
 *
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/mem-grade")
@RequiredArgsConstructor
@UserOnly
public class BoMbMemGradeController {
    private final BoMbMemGradeService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGradeDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<MbMemberGradeDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbMemberGradeDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<MbMemberGradeDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGrade>> create(@RequestBody MbMemberGrade body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGradeDto>> update(@PathVariable String id, @RequestBody MbMemberGrade body) {
        MbMemberGradeDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
