package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhOrderItemChgHistService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-item-chg-hist")
@RequiredArgsConstructor
public class OdhOrderItemChgHistController {

    private final OdhOrderItemChgHistService service;

    /* 주문 아이템 변경 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderItemChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 아이템 변경 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhOrderItemChgHistDto.Item>>> list(@Valid @ModelAttribute OdhOrderItemChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 아이템 변경 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhOrderItemChgHistDto.PageResponse>> page(@Valid @ModelAttribute OdhOrderItemChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 아이템 변경 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhOrderItemChgHist>> create(@RequestBody OdhOrderItemChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 아이템 변경 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderItemChgHist>> save(@PathVariable("id") String id, @RequestBody OdhOrderItemChgHist entity) {
        entity.setOrderItemChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 주문 아이템 변경 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderItemChgHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhOrderItemChgHist entity) {
        entity.setOrderItemChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 아이템 변경 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdhOrderItemChgHist>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdhOrderItemChgHist entity) {
        OdhOrderItemChgHist result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdhOrderItemChgHist> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
