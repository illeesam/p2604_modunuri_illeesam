package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.auth.annotation.BoOnly;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdRestockNotiService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 재입고알림 API — /api/bo/ec/pd/restock-noti
 */
@RestController
@RequestMapping("/api/bo/ec/pd/restock-noti")
@RequiredArgsConstructor
@BoOnly
public class BoPdRestockNotiController {
    private final BoPdRestockNotiService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdRestockNotiDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdRestockNotiDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdRestockNoti>> create(@RequestBody PdRestockNoti body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNotiDto>> update(@PathVariable String id, @RequestBody PdRestockNoti body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdRestockNotiDto>> upsert(@PathVariable String id, @RequestBody PdRestockNoti body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Void>> send(@RequestBody Map<String, Object> body) {
        service.send(body);
        return ResponseEntity.ok(ApiResponse.ok(null, "발송되었습니다."));
    }
}
