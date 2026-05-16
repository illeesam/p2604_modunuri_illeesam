package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachGrpService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/attach-grp")
@RequiredArgsConstructor
public class SyAttachGrpController {

    private final SyAttachGrpService service;

    /* 첨부파일 그룹 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachGrpDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 첨부파일 그룹 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAttachGrpDto.Item>>> list(@Valid @ModelAttribute SyAttachGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 첨부파일 그룹 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyAttachGrpDto.PageResponse>> page(@Valid @ModelAttribute SyAttachGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 첨부파일 그룹 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyAttachGrp>> create(@RequestBody SyAttachGrp entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 첨부파일 그룹 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachGrp>> save(@PathVariable("id") String id, @RequestBody SyAttachGrp entity) {
        entity.setAttachGrpId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 첨부파일 그룹 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachGrp>> updateSelective(@PathVariable("id") String id, @RequestBody SyAttachGrp entity) {
        entity.setAttachGrpId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 첨부파일 그룹 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 첨부파일 그룹 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyAttachGrp> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
