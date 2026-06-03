package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/save")
@RequiredArgsConstructor
public class PmSaveController {

    private final PmSaveService service;

    /* 적립금 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 적립금 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveDto.Item>>> list(@Valid @ModelAttribute PmSaveDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 적립금 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmSaveDto.PageResponse>> page(@Valid @ModelAttribute PmSaveDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 적립금 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSave>> create(@RequestBody PmSave entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 적립금 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSave>> save(@PathVariable("id") String id, @RequestBody PmSave entity) {
        entity.setSaveId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 적립금 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSave>> updateSelective(@PathVariable("id") String id, @RequestBody PmSave entity) {
        entity.setSaveId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 적립금 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmSave>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmSave entity) {
        PmSave result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmSave> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
