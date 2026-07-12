package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptTypeDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptType;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptTypeService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-opt-type")
@RequiredArgsConstructor
public class PdProdOptTypeController {

    private final PdProdOptTypeService service;

    /* 옵션유형 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOptTypeDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 옵션유형 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdOptTypeDto.Item>>> list(@Valid @ModelAttribute PdProdOptTypeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 옵션유형 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdOptTypeDto.PageResponse>> page(@Valid @ModelAttribute PdProdOptTypeDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 옵션유형 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdProdOptType>> create(@RequestBody PdProdOptType entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 옵션유형 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOptType>> save(@PathVariable("id") String id, @RequestBody PdProdOptType entity) {
        entity.setProdOptTypeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 옵션유형 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdOptType>> updateSelective(@PathVariable("id") String id, @RequestBody PdProdOptType entity) {
        entity.setProdOptTypeId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 옵션유형 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save — rowStatus 단건 분기 저장 */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdProdOptType>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdProdOptType entity) {
        PdProdOptType result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdProdOptType> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
