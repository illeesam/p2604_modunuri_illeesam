package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntUsageService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/discnt-usage")
@RequiredArgsConstructor
public class PmDiscntUsageController {

    private final PmDiscntUsageService service;

    /* 할인 사용 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntUsageDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 할인 사용 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmDiscntUsageDto.Item>>> list(@Valid @ModelAttribute PmDiscntUsageDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 할인 사용 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmDiscntUsageDto.PageResponse>> page(@Valid @ModelAttribute PmDiscntUsageDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 할인 사용 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmDiscntUsage>> create(@RequestBody PmDiscntUsage entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 할인 사용 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntUsage>> save(@PathVariable("id") String id, @RequestBody PmDiscntUsage entity) {
        entity.setDiscntUsageId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 할인 사용 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntUsage>> updateSelective(@PathVariable("id") String id, @RequestBody PmDiscntUsage entity) {
        entity.setDiscntUsageId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 할인 사용 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmDiscntUsage>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmDiscntUsage entity) {
        PmDiscntUsage result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmDiscntUsage> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
