package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberGradeService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<MbMemberGrade>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody MbMemberGrade entity) {
        MbMemberGrade result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<MbMemberGrade> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
