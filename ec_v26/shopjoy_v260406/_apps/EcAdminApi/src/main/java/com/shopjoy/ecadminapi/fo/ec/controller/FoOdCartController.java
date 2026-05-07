package com.shopjoy.ecadminapi.fo.ec.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoOdCartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * FO 장바구니 API — 현재 로그인 회원 전용
 * GET    /api/fo/ec/od/cart         — 내 장바구니 조회
 * POST   /api/fo/ec/od/cart         — 상품 담기
 * PATCH  /api/fo/ec/od/cart/{cartId} — 수량 변경
 * DELETE /api/fo/ec/od/cart/{cartId} — 상품 제거
 *
 * 인가: USER or MEMBER (SecurityConfig 전역 룰)
 */
@RestController
@RequestMapping("/api/fo/ec/od/cart")
@RequiredArgsConstructor
public class FoOdCartController {

    private final FoOdCartService foOdCartService;

    /** myCart */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdCartDto>>> myCart(
            @RequestParam Map<String, Object> p) {
        List<OdCartDto> result = foOdCartService.getMyCart(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** add — 추가 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdCart>> add(@RequestBody OdCart entity) {
        OdCart result = foOdCartService.addToCart(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** updateQty — 수정 */
    @PatchMapping("/{cartId}")
    public ResponseEntity<ApiResponse<OdCart>> updateQty(
            @PathVariable("cartId") String cartId,
            @RequestBody Map<String, Integer> body) {
        int qty = body.getOrDefault("qty", 1);
        OdCart result = foOdCartService.updateQty(cartId, qty);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** remove — 삭제 */
    @DeleteMapping("/{cartId}")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable("cartId") String cartId) {
        foOdCartService.removeFromCart(cartId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
