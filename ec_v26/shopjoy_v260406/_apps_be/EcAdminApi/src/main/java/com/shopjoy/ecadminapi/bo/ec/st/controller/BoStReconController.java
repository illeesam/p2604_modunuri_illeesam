package com.shopjoy.ecadminapi.bo.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.bo.ec.st.service.BoStReconService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 정산대사 API — /api/bo/ec/st/recon
 */
@RestController
@RequestMapping("/api/bo/ec/st/recon")
@RequiredArgsConstructor
public class BoStReconController {
    private final BoStReconService boStReconService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StReconDto.Item>>> list(@Valid @ModelAttribute StReconDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StReconDto.PageResponse>> page(@Valid @ModelAttribute StReconDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StReconDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.getById(id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<StRecon>> create(@RequestBody StRecon body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boStReconService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StRecon>> update(@PathVariable("id") String id, @RequestBody StRecon body) {
        return ResponseEntity.ok(ApiResponse.ok(boStReconService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boStReconService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
