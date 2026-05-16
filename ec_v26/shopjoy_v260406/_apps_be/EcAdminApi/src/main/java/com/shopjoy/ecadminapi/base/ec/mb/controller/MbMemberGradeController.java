package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberGradeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/member-grade")
@RequiredArgsConstructor
public class MbMemberGradeController {

    private final MbMemberGradeService service;

    /* 회원 등급 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGradeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 회원 등급 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGradeDto.Item>>> list(@Valid @ModelAttribute MbMemberGradeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 회원 등급 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberGradeDto.PageResponse>> page(@Valid @ModelAttribute MbMemberGradeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 회원 등급 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGrade>> create(@RequestBody MbMemberGrade entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 회원 등급 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGrade>> save(@PathVariable("id") String id, @RequestBody MbMemberGrade entity) {
        entity.setMemberGradeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 회원 등급 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGrade>> updateSelective(@PathVariable("id") String id, @RequestBody MbMemberGrade entity) {
        entity.setMemberGradeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 회원 등급 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 회원 등급 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberGrade> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
