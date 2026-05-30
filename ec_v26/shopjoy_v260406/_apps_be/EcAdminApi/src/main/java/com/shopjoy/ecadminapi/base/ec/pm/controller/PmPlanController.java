package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmPlanService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/plan")
@RequiredArgsConstructor
public class PmPlanController {

    private final PmPlanService service;

    /* 프로모션 플랜 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlanDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 프로모션 플랜 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmPlanDto.Item>>> list(@Valid @ModelAttribute PmPlanDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 프로모션 플랜 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmPlanDto.PageResponse>> page(@Valid @ModelAttribute PmPlanDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 프로모션 플랜 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmPlan>> create(@RequestBody PmPlan entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 프로모션 플랜 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlan>> save(@PathVariable("id") String id, @RequestBody PmPlan entity) {
        entity.setPlanId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 프로모션 플랜 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmPlan>> updateSelective(@PathVariable("id") String id, @RequestBody PmPlan entity) {
        entity.setPlanId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 프로모션 플랜 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmPlan>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmPlan entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmPlan> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
