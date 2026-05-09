package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdCartService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdCartDto.Item>>> list(@Valid @ModelAttribute OdCartDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdCartService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdCartDto.PageResponse>> page(@Valid @ModelAttribute OdCartDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdCartService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdCartDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boOdCartService.getById(id)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boOdCartService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
