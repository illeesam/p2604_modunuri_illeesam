package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdOrderItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 주문항목 API
 * GET  /api/bo/ec/od/order-item       — 목록
 * GET  /api/bo/ec/od/order-item/page  — 페이징
 * GET  /api/bo/ec/od/order-item/{id}  — 단건
 */
@RestController
@RequestMapping("/api/bo/ec/od/order-item")
@RequiredArgsConstructor
public class BoOdOrderItemController {

    private final BoOdOrderItemService boOdOrderItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderItemDto.Item>>> list(
            @Valid @ModelAttribute OdOrderItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderItemService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<OdOrderItemDto.Item>>> page(
            @Valid @ModelAttribute OdOrderItemDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderItemService.getPageData(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItemDto.Item>> getById(
            @PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderItemService.getById(id)));
    }
}
