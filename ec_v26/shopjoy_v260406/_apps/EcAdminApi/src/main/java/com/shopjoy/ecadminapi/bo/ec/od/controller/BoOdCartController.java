package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdCartService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 장바구니 API
 * GET    /api/bo/ec/od/cart       — 목록
 * GET    /api/bo/ec/od/cart/page  — 페이징
 * GET    /api/bo/ec/od/cart/{id}  — 단건
 * DELETE /api/bo/ec/od/cart/{id}  — 삭제
 */
@RestController
@RequestMapping("/api/bo/ec/od/cart")
@RequiredArgsConstructor
public class BoOdCartController {
    private final BoOdCartService boOdCartService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdCartDto>>> list(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boOdCartService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<OdCartDto>>> page(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(boOdCartService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdCartDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boOdCartService.getById(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boOdCartService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
