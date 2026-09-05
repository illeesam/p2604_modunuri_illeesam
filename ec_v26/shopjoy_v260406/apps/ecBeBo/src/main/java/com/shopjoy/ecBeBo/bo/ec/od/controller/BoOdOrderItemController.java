package com.shopjoy.ecBeBo.bo.ec.od.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecBeBo.bo.ec.od.service.BoOdOrderItemService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
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
 * PATCH /api/bo/ec/od/order-item/{id} — 선택적 수정(상태/배송방법 override 등)
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

    /* 선택적 수정 — orderItemStatusCd/dlivMethodCd 등 null 이 아닌 필드만 반영 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderItem>> updateSelective(
            @PathVariable("id") String id, @Valid @RequestBody OdOrderItem body) {
        body.setOrderItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(boOdOrderItemService.updateSelective(body)));
    }
}
