package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3;
import com.shopjoy.ecadminapi.base.zz.service.ZzExam3Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/zz-exam3")
@RequiredArgsConstructor
public class ZzExam3Controller {

    private final ZzExam3Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzExam3Dto.Item>>> list(@Valid @ModelAttribute ZzExam3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzExam3Dto.PageResponse>> page(@Valid @ModelAttribute ZzExam3Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 (복합 PK) */
    @GetMapping("/{exam1Id}/{exam2Id}/{exam3Id}")
    public ResponseEntity<ApiResponse<ZzExam3Dto.Item>> getById(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id,
            @PathVariable("exam3Id") String exam3Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(exam1Id, exam2Id, exam3Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzExam3>> create(@RequestBody ZzExam3 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{exam1Id}/{exam2Id}/{exam3Id}")
    public ResponseEntity<ApiResponse<ZzExam3>> update(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id,
            @PathVariable("exam3Id") String exam3Id,
            @RequestBody ZzExam3 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(exam1Id, exam2Id, exam3Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{exam1Id}/{exam2Id}/{exam3Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id,
            @PathVariable("exam3Id") String exam3Id,
            @RequestBody ZzExam3 entity) {
        entity.setExam1Id(exam1Id);
        entity.setExam2Id(exam2Id);
        entity.setExam3Id(exam3Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{exam1Id}/{exam2Id}/{exam3Id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id,
            @PathVariable("exam3Id") String exam3Id) {
        service.delete(exam1Id, exam2Id, exam3Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<ZzExam3> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
