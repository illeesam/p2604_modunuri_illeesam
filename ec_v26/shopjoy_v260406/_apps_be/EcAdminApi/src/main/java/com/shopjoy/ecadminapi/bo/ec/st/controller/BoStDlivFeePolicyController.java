package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StDlivFeePolicyDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StDlivFeePolicy;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStDlivFeePolicyService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 배송수수료정책 API — /api/bo/ec/st/dliv-fee-policy
 */
@RestController
@RequestMapping("/api/bo/ec/st/dliv-fee-policy")
@RequiredArgsConstructor
public class BoStDlivFeePolicyController {
    private final BoStDlivFeePolicyService boStDlivFeePolicyService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StDlivFeePolicyDto.Item>>> list(@Valid @ModelAttribute StDlivFeePolicyDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStDlivFeePolicyService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<StDlivFeePolicyDto.Item>>> page(@Valid @ModelAttribute StDlivFeePolicyDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStDlivFeePolicyService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StDlivFeePolicyDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boStDlivFeePolicyService.getById(id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StDlivFeePolicy>> create(@Valid @RequestBody StDlivFeePolicy body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStDlivFeePolicyService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StDlivFeePolicy>> update(@PathVariable("id") String id, @Valid @RequestBody StDlivFeePolicy body) {
        return ResponseEntity.ok(ApiResponse.ok(boStDlivFeePolicyService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStDlivFeePolicyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) — CRUD 그리드 화면용 */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<StDlivFeePolicy> rows) {
        switch (cmd) {
            case "base" -> boStDlivFeePolicyService.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
