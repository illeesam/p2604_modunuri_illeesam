package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdViewLogService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-view-log")
@RequiredArgsConstructor
public class PdhProdViewLogController {

    private final PdhProdViewLogService service;

    /* 상품 조회 로그 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdViewLogDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 상품 조회 로그 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdViewLogDto.Item>>> list(@Valid @ModelAttribute PdhProdViewLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 상품 조회 로그 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdViewLogDto.PageResponse>> page(@Valid @ModelAttribute PdhProdViewLogDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 상품 조회 로그 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdViewLog>> create(@RequestBody PdhProdViewLog entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 상품 조회 로그 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdViewLog>> save(@PathVariable("id") String id, @RequestBody PdhProdViewLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 상품 조회 로그 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdViewLog>> updateSelective(@PathVariable("id") String id, @RequestBody PdhProdViewLog entity) {
        entity.setLogId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 상품 조회 로그 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdhProdViewLog>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdhProdViewLog entity) {
        PdhProdViewLog result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdhProdViewLog> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
