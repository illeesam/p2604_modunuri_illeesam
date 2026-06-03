package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.ec.od.service.OdRefundService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/refund")
@RequiredArgsConstructor
public class OdRefundController {

    private final OdRefundService service;

    /* 환불 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefundDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 환불 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdRefundDto.Item>>> list(@Valid @ModelAttribute OdRefundDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 환불 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdRefundDto.PageResponse>> page(@Valid @ModelAttribute OdRefundDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 환불 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdRefund>> create(@RequestBody OdRefund entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 환불 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefund>> save(@PathVariable("id") String id, @RequestBody OdRefund entity) {
        entity.setRefundId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 환불 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdRefund>> updateSelective(@PathVariable("id") String id, @RequestBody OdRefund entity) {
        entity.setRefundId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 환불 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdRefund>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdRefund entity) {
        OdRefund result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdRefund> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
