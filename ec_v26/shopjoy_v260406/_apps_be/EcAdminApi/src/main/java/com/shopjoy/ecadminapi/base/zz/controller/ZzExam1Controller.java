package com.shopjoy.ecadminapi.base.zz.controller;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam1;
import com.shopjoy.ecadminapi.base.zz.service.ZzExam1Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/zz-exam1")
@RequiredArgsConstructor
public class ZzExam1Controller {

    private final ZzExam1Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzExam1Dto.Item>>> list(@Valid @ModelAttribute ZzExam1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<ZzExam1Dto.PageResponse>> page(@Valid @ModelAttribute ZzExam1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{exam1Id}")
    public ResponseEntity<ApiResponse<ZzExam1Dto.Item>> getById(@PathVariable("exam1Id") String exam1Id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(exam1Id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzExam1>> create(@RequestBody ZzExam1 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{exam1Id}")
    public ResponseEntity<ApiResponse<ZzExam1>> update(
            @PathVariable("exam1Id") String exam1Id, @RequestBody ZzExam1 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(exam1Id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{exam1Id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("exam1Id") String exam1Id, @RequestBody ZzExam1 entity) {
        entity.setExam1Id(exam1Id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{exam1Id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("exam1Id") String exam1Id) {
        service.delete(exam1Id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<ZzExam1> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
