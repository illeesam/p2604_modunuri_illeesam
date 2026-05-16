package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventBenefitService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/event-benefit")
@RequiredArgsConstructor
public class PmEventBenefitController {

    private final PmEventBenefitService service;

    /* 이벤트 혜택 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventBenefitDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 이벤트 혜택 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmEventBenefitDto.Item>>> list(@Valid @ModelAttribute PmEventBenefitDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 이벤트 혜택 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmEventBenefitDto.PageResponse>> page(@Valid @ModelAttribute PmEventBenefitDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 이벤트 혜택 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmEventBenefit>> create(@RequestBody PmEventBenefit entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 이벤트 혜택 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventBenefit>> save(@PathVariable("id") String id, @RequestBody PmEventBenefit entity) {
        entity.setBenefitId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 이벤트 혜택 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventBenefit>> updateSelective(@PathVariable("id") String id, @RequestBody PmEventBenefit entity) {
        entity.setBenefitId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 이벤트 혜택 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 이벤트 혜택 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmEventBenefit> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
