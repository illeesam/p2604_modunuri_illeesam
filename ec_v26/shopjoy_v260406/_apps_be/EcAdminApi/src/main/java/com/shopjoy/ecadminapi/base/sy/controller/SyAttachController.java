package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/attach")
@RequiredArgsConstructor
public class SyAttachController {

    private final SyAttachService service;

    /* 첨부파일 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 첨부파일 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAttachDto.Item>>> list(@Valid @ModelAttribute SyAttachDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 첨부파일 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyAttachDto.PageResponse>> page(@Valid @ModelAttribute SyAttachDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 첨부파일 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyAttach>> create(@RequestBody SyAttach entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 첨부파일 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttach>> save(@PathVariable("id") String id, @RequestBody SyAttach entity) {
        entity.setAttachId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 첨부파일 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttach>> updateSelective(@PathVariable("id") String id, @RequestBody SyAttach entity) {
        entity.setAttachId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 첨부파일 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyAttach>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyAttach entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyAttach> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
