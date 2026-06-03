package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.service.SyCodeGrpService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/code-grp")
@RequiredArgsConstructor
public class SyCodeGrpController {

    private final SyCodeGrpService service;

    /* 공통 코드 그룹 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrpDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 공통 코드 그룹 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeGrpDto.Item>>> list(@Valid @ModelAttribute SyCodeGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 공통 코드 그룹 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyCodeGrpDto.PageResponse>> page(@Valid @ModelAttribute SyCodeGrpDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 공통 코드 그룹 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyCodeGrp>> create(@RequestBody SyCodeGrp entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 공통 코드 그룹 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrp>> save(@PathVariable("id") String id, @RequestBody SyCodeGrp entity) {
        entity.setCodeGrpId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 공통 코드 그룹 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrp>> updateSelective(@PathVariable("id") String id, @RequestBody SyCodeGrp entity) {
        entity.setCodeGrpId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 공통 코드 그룹 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyCodeGrp>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyCodeGrp entity) {
        SyCodeGrp result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyCodeGrp> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
