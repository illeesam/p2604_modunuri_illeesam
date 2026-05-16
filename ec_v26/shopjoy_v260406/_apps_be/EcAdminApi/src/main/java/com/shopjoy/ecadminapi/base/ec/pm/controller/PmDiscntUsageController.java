package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntUsageService;
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
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
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

    /* 할인 사용 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmDiscntUsage> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
