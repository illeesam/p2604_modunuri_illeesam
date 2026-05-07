package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemGradeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 회원등급 API
 * GET    /api/bo/ec/mb/member-grade       — 목록
 * GET    /api/bo/ec/mb/member-grade/page  — 페이징
 * GET    /api/bo/ec/mb/member-grade/{id}  — 단건
 * POST   /api/bo/ec/mb/member-grade       — 등록
 * PUT    /api/bo/ec/mb/member-grade/{id}  — 수정
 * DELETE /api/bo/ec/mb/member-grade/{id}  — 삭제
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-grade")
@RequiredArgsConstructor
public class BoMbMemGradeController {
    private final BoMbMemGradeService boMbMemGradeService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGradeDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<MbMemberGradeDto> result = boMbMemGradeService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<MbMemberGradeDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<MbMemberGradeDto> result = boMbMemGradeService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGradeDto>> getById(@PathVariable("id") String id) {
        MbMemberGradeDto result = boMbMemGradeService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGrade>> create(@RequestBody MbMemberGrade body) {
        MbMemberGrade result = boMbMemGradeService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGradeDto>> update(@PathVariable("id") String id, @RequestBody MbMemberGrade body) {
        MbMemberGradeDto result = boMbMemGradeService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGradeDto>> upsert(@PathVariable("id") String id, @RequestBody MbMemberGrade body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGradeService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbMemGradeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberGrade> rows) {
        boMbMemGradeService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
