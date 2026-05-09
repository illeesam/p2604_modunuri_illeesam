package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyAttachGrpService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 첨부파일그룹 API — /api/bo/sy/attach-grp
 */
@RestController
@RequestMapping("/api/bo/sy/attach-grp")
@RequiredArgsConstructor
public class BoSyAttachGrpController {

    private final BoSyAttachGrpService boSyAttachGrpService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachGrpDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachGrpService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyAttachGrpDto.Item>>> list(@Valid @ModelAttribute SyAttachGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachGrpService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyAttachGrpDto.PageResponse>> page(@Valid @ModelAttribute SyAttachGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachGrpService.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyAttachGrp>> create(@RequestBody SyAttachGrp body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyAttachGrpService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachGrp>> update(@PathVariable("id") String id, @RequestBody SyAttachGrp body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachGrpService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyAttachGrp>> upsert(@PathVariable("id") String id, @RequestBody SyAttachGrp body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyAttachGrpService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyAttachGrpService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyAttachGrp> rows) {
        boSyAttachGrpService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
