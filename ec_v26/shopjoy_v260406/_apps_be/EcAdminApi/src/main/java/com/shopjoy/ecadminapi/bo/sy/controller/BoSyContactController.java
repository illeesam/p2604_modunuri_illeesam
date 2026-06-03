package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyContactService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 문의 API — /api/bo/sy/contact
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/contact")
@RequiredArgsConstructor
public class BoSyContactController {
    private final BoSyContactService boSyContactService;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyContactDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boSyContactService.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyContactDto.Item>>> list(@Valid @ModelAttribute SyContactDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyContactService.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyContactDto.PageResponse>> page(@Valid @ModelAttribute SyContactDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boSyContactService.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyContact>> create(@RequestBody SyContact body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boSyContactService.create(body)));
    }

    /* 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyContact>> update(@PathVariable("id") String id, @RequestBody SyContact body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyContactService.update(id, body)));
    }

    /* upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyContact>> upsert(@PathVariable("id") String id, @RequestBody SyContact body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyContactService.update(id, body)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyContactService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: order 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyContact> rows) {
        switch (cmd) {
            case "base" -> boSyContactService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
