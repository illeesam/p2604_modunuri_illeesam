package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.service.SyCodeService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/code")
@RequiredArgsConstructor
public class SyCodeController {

    private final SyCodeService service;

    /* 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeDto.Item>>> list(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyCodeDto.PageResponse>> page(@Valid @ModelAttribute SyCodeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyCode>> create(@RequestBody SyCode entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> save(@PathVariable("id") String id, @RequestBody SyCode entity) {
        entity.setCodeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCode>> updateSelective(@PathVariable("id") String id, @RequestBody SyCode entity) {
        entity.setCodeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyCode>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyCode entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyCode> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
