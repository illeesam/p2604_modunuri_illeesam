package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettlePayService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle-pay")
@RequiredArgsConstructor
public class StSettlePayController {

    private final StSettlePayService service;

    /* 정산 지급 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettlePayDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 지급 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettlePayDto.Item>>> list(@Valid @ModelAttribute StSettlePayDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 지급 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettlePayDto.PageResponse>> page(@Valid @ModelAttribute StSettlePayDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 지급 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettlePay>> create(@RequestBody StSettlePay entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 지급 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettlePay>> save(@PathVariable("id") String id, @RequestBody StSettlePay entity) {
        entity.setSettlePayId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 정산 지급 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettlePay>> updateSelective(@PathVariable("id") String id, @RequestBody StSettlePay entity) {
        entity.setSettlePayId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 지급 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<StSettlePay>> saveDefault(@RequestBody StSettlePay entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<StSettlePay>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody StSettlePay entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StSettlePay> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<StSettlePay> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
