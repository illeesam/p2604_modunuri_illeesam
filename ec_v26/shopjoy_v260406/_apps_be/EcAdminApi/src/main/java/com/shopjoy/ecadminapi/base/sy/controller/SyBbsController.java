package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.service.SyBbsService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/bbs")
@RequiredArgsConstructor
public class SyBbsController {

    private final SyBbsService service;

    /* 게시판 게시물 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbsDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 게시판 게시물 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyBbsDto.Item>>> list(@Valid @ModelAttribute SyBbsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 게시판 게시물 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyBbsDto.PageResponse>> page(@Valid @ModelAttribute SyBbsDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 게시판 게시물 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyBbs>> create(@RequestBody SyBbs entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 게시판 게시물 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbs>> save(@PathVariable("id") String id, @RequestBody SyBbs entity) {
        entity.setBbsId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 게시판 게시물 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyBbs>> updateSelective(@PathVariable("id") String id, @RequestBody SyBbs entity) {
        entity.setBbsId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 게시판 게시물 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyBbs>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyBbs entity) {
        SyBbs result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyBbs> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
