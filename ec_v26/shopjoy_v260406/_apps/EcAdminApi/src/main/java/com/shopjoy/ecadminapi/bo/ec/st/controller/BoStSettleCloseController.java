package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStSettleCloseService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 정산마감 API — /api/bo/ec/st/close
 */
@RestController
@RequestMapping("/api/bo/ec/st/close")
@RequiredArgsConstructor
public class BoStSettleCloseController {
    private final BoStSettleCloseService boStSettleCloseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleCloseDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<StSettleCloseDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleCloseDto>> getById(@PathVariable("id") String id) {
        StSettleCloseDto result = boStSettleCloseService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StSettleClose>> create(@RequestBody StSettleClose body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStSettleCloseService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleCloseDto>> update(@PathVariable("id") String id, @RequestBody StSettleClose body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleCloseDto>> upsert(@PathVariable("id") String id, @RequestBody StSettleClose body) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStSettleCloseService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PutMapping("/{id}/reopen")
    public ResponseEntity<ApiResponse<StSettleCloseDto>> reopen(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boStSettleCloseService.reopen(id)));
    }
}
