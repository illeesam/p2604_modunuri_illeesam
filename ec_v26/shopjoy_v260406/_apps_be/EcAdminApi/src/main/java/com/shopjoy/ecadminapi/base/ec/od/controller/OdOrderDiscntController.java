package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderDiscntService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-discnt")
@RequiredArgsConstructor
public class OdOrderDiscntController {

    private final OdOrderDiscntService service;

    /* 주문 할인 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDiscntDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 주문 할인 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdOrderDiscntDto.Item>>> list(@Valid @ModelAttribute OdOrderDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 주문 할인 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdOrderDiscntDto.PageResponse>> page(@Valid @ModelAttribute OdOrderDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 주문 할인 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdOrderDiscnt>> create(@RequestBody OdOrderDiscnt entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 주문 할인 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDiscnt>> save(@PathVariable("id") String id, @RequestBody OdOrderDiscnt entity) {
        entity.setOrderDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 주문 할인 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdOrderDiscnt>> updateSelective(@PathVariable("id") String id, @RequestBody OdOrderDiscnt entity) {
        entity.setOrderDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 주문 할인 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdOrderDiscnt>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdOrderDiscnt entity) {
        OdOrderDiscnt result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdOrderDiscnt> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
