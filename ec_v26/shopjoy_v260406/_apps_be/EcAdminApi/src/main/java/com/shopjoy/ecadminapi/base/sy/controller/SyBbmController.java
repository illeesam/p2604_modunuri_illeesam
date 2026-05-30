package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.service.SyBbmService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/bbm")
@RequiredArgsConstructor
public class SyBbmController {

    private final SyBbmService service;

    /* 게시판 마스터 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbmDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 게시판 마스터 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBbmDto.Item>>> list(@Valid @ModelAttribute SyBbmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 게시판 마스터 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBbmDto.PageResponse>> page(@Valid @ModelAttribute SyBbmDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 게시판 마스터 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyBbm>> create(@RequestBody SyBbm entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 게시판 마스터 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbm>> save(@PathVariable("id") String id, @RequestBody SyBbm entity) {
        entity.setBbmId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 게시판 마스터 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbm>> updateSelective(@PathVariable("id") String id, @RequestBody SyBbm entity) {
        entity.setBbmId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 게시판 마스터 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<SyBbm>> saveDefault(@RequestBody SyBbm entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyBbm>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyBbm entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyBbm> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyBbm> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
