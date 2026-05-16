package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam2Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam2;
import com.shopjoy.ecadminapi.base.zz.service.ZzExam2Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/zz-exam2")
@RequiredArgsConstructor
public class ZzExam2Controller {

    private final ZzExam2Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzExam2Dto.Item>>> list(@Valid @ModelAttribute ZzExam2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzExam2Dto.PageResponse>> page(@Valid @ModelAttribute ZzExam2Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 (복합 PK) */
    @GetMapping("/{exam1Id}/{exam2Id}")
    public ResponseEntity<ApiResponse<ZzExam2Dto.Item>> getById(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(exam1Id, exam2Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzExam2>> create(@RequestBody ZzExam2 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{exam1Id}/{exam2Id}")
    public ResponseEntity<ApiResponse<ZzExam2>> update(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id,
            @RequestBody ZzExam2 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(exam1Id, exam2Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{exam1Id}/{exam2Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id,
            @RequestBody ZzExam2 entity) {
        entity.setExam1Id(exam1Id);
        entity.setExam2Id(exam2Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{exam1Id}/{exam2Id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable("exam1Id") String exam1Id,
            @PathVariable("exam2Id") String exam2Id) {
        service.delete(exam1Id, exam2Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<ZzExam2> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
