package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;
import com.shopjoy.ecadminapi.base.ec.od.service.OdPayService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/pay")
@RequiredArgsConstructor
public class OdPayController {

    private final OdPayService service;

    /* 결제 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPayDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 결제 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdPayDto.Item>>> list(@Valid @ModelAttribute OdPayDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 결제 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdPayDto.PageResponse>> page(@Valid @ModelAttribute OdPayDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 결제 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdPay>> create(@RequestBody OdPay entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 결제 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPay>> save(@PathVariable("id") String id, @RequestBody OdPay entity) {
        entity.setPayId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 결제 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPay>> updateSelective(@PathVariable("id") String id, @RequestBody OdPay entity) {
        entity.setPayId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 결제 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 결제 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdPay> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
