package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.auth.annotation.BoOnly;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleEtcAdjService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 기타정산조정 API — /api/bo/ec/st/etc-adj
 */
@RestController
@RequestMapping("/api/bo/ec/st/etc-adj")
@RequiredArgsConstructor
@BoOnly
public class BoStSettleEtcAdjController {
    private final BoStSettleEtcAdjService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleEtcAdjDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleEtcAdjDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StSettleEtcAdj>> create(@RequestBody StSettleEtcAdj body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdjDto>> update(@PathVariable String id, @RequestBody StSettleEtcAdj body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleEtcAdjDto>> upsert(@PathVariable String id, @RequestBody StSettleEtcAdj body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
