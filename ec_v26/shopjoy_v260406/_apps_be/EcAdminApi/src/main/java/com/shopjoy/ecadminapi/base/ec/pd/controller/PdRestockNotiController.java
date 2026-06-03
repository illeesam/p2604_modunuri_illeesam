package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdRestockNotiService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/restock-noti")
@RequiredArgsConstructor
public class PdRestockNotiController {

    private final PdRestockNotiService service;

    /* 재입고 알림 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNotiDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 재입고 알림 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdRestockNotiDto.Item>>> list(@Valid @ModelAttribute PdRestockNotiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 재입고 알림 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdRestockNotiDto.PageResponse>> page(@Valid @ModelAttribute PdRestockNotiDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 재입고 알림 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdRestockNoti>> create(@RequestBody PdRestockNoti entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 재입고 알림 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNoti>> save(@PathVariable("id") String id, @RequestBody PdRestockNoti entity) {
        entity.setRestockNotiId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 재입고 알림 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNoti>> updateSelective(@PathVariable("id") String id, @RequestBody PdRestockNoti entity) {
        entity.setRestockNotiId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 재입고 알림 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdRestockNoti>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdRestockNoti entity) {
        PdRestockNoti result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdRestockNoti> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
