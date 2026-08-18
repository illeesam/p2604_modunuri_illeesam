package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StDlivFeePolicyDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StDlivFeePolicy;
import com.shopjoy.ecadminapi.base.ec.st.service.StDlivFeePolicyService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/dliv-fee-policy")
@RequiredArgsConstructor
public class StDlivFeePolicyController {

    private final StDlivFeePolicyService service;

    /* 배송수수료정책 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StDlivFeePolicyDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 배송수수료정책 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StDlivFeePolicyDto.Item>>> list(@Valid @ModelAttribute StDlivFeePolicyDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 배송수수료정책 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<StDlivFeePolicyDto.Item>>> page(@Valid @ModelAttribute StDlivFeePolicyDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 배송수수료정책 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StDlivFeePolicy>> create(@Valid @RequestBody StDlivFeePolicy entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 배송수수료정책 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StDlivFeePolicy>> save(@PathVariable("id") String id, @Valid @RequestBody StDlivFeePolicy entity) {
        entity.setDlivFeePolicyId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 배송수수료정책 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<StDlivFeePolicy>> saveOneCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody StDlivFeePolicy entity) {
        StDlivFeePolicy result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<StDlivFeePolicy> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
