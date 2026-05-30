package com.shopjoy.ecadminapi.base.ec.mb.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberGroupService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/mb/member-group")
@RequiredArgsConstructor
public class MbMemberGroupController {

    private final MbMemberGroupService service;

    /* 회원 그룹 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroupDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 회원 그룹 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MbMemberGroupDto.Item>>> list(@Valid @ModelAttribute MbMemberGroupDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 회원 그룹 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<MbMemberGroupDto.PageResponse>> page(@Valid @ModelAttribute MbMemberGroupDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 회원 그룹 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<MbMemberGroup>> create(@RequestBody MbMemberGroup entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 회원 그룹 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroup>> save(@PathVariable("id") String id, @RequestBody MbMemberGroup entity) {
        entity.setMemberGroupId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 회원 그룹 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<MbMemberGroup>> updateSelective(@PathVariable("id") String id, @RequestBody MbMemberGroup entity) {
        entity.setMemberGroupId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 회원 그룹 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<MbMemberGroup>> saveDefault(@RequestBody MbMemberGroup entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<MbMemberGroup>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody MbMemberGroup entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<MbMemberGroup> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<MbMemberGroup> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
