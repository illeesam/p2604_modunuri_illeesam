package com.shopjoy.ecadminapi.bo.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.bo.ec.mb.service.BoMbMemGradeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 회원등급 API — /api/bo/ec/mb/member-grade
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/mb/member-grade")
@RequiredArgsConstructor
public class BoMbMemGradeController {
    private final BoMbMemGradeService boMbMemGradeService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGradeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGradeService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGradeDto.Item>>> list(@Valid @ModelAttribute MbMemberGradeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGradeService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberGradeDto.PageResponse>> page(@Valid @ModelAttribute MbMemberGradeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGradeService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGrade>> create(@RequestBody MbMemberGrade body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boMbMemGradeService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGrade>> update(@PathVariable("id") String id, @RequestBody MbMemberGrade body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGradeService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGrade>> upsert(@PathVariable("id") String id, @RequestBody MbMemberGrade body) {
        return ResponseEntity.ok(ApiResponse.ok(boMbMemGradeService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boMbMemGradeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberGrade> rows) {
        boMbMemGradeService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
