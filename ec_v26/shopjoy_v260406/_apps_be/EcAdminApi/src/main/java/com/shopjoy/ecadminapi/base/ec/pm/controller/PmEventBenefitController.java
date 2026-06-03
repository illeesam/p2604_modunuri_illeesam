package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventBenefitService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmEventBenefit>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmEventBenefit entity) {
        PmEventBenefit result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmEventBenefit> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
