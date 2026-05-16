package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.service.OdCartService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/cart")
@RequiredArgsConstructor
public class OdCartController {

    private final OdCartService service;

    /* 장바구니 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdCartDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 장바구니 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdCartDto.Item>>> list(@Valid @ModelAttribute OdCartDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 장바구니 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdCartDto.PageResponse>> page(@Valid @ModelAttribute OdCartDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 장바구니 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdCart>> create(@RequestBody OdCart entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 장바구니 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdCart>> save(@PathVariable("id") String id, @RequestBody OdCart entity) {
        entity.setCartId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 장바구니 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdCart>> updateSelective(@PathVariable("id") String id, @RequestBody OdCart entity) {
        entity.setCartId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 장바구니 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 장바구니 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdCart> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
