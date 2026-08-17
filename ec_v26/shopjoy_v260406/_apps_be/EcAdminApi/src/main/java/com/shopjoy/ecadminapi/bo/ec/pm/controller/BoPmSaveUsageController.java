package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveUsageService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 적립금사용이력 API — /api/bo/ec/pm/save-usage
 * 인가: BO_ONLY (관리자). 비즈니스 로직 없는 단순 CRUD 위임이므로
 * base PmSaveUsageService 직접 주입 (base.기술-api §3.5 예외 허용).
 */
@RestController
@RequestMapping("/api/bo/ec/pm/save-usage")
@RequiredArgsConstructor
public class BoPmSaveUsageController {

    private final PmSaveUsageService service;

    /* 적립금 사용 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveUsageDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 적립금 사용 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveUsageDto.Item>>> list(@Valid @ModelAttribute PmSaveUsageDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 적립금 사용 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<PmSaveUsageDto.Item>>> page(@Valid @ModelAttribute PmSaveUsageDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 적립금 사용 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSaveUsage>> create(@RequestBody PmSaveUsage entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 적립금 사용 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveUsage>> save(@PathVariable("id") String id, @RequestBody PmSaveUsage entity) {
        entity.setSaveUsageId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 적립금 사용 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveUsage>> updateSelective(@PathVariable("id") String id, @RequestBody PmSaveUsage entity) {
        entity.setSaveUsageId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 적립금 사용 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 적립금 사용 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmSaveUsage> rows) {
        service.saveListBase(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
