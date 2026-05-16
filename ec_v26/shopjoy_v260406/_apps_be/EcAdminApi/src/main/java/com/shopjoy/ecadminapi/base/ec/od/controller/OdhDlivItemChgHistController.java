package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhDlivItemChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/dliv-item-chg-hist")
@RequiredArgsConstructor
public class OdhDlivItemChgHistController {

    private final OdhDlivItemChgHistService service;

    /* 배송 아이템 변경 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivItemChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 배송 아이템 변경 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhDlivItemChgHistDto.Item>>> list(@Valid @ModelAttribute OdhDlivItemChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 배송 아이템 변경 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhDlivItemChgHistDto.PageResponse>> page(@Valid @ModelAttribute OdhDlivItemChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 배송 아이템 변경 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhDlivItemChgHist>> create(@RequestBody OdhDlivItemChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 배송 아이템 변경 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivItemChgHist>> save(@PathVariable("id") String id, @RequestBody OdhDlivItemChgHist entity) {
        entity.setDlivItemChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 배송 아이템 변경 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhDlivItemChgHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhDlivItemChgHist entity) {
        entity.setDlivItemChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 배송 아이템 변경 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 배송 아이템 변경 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhDlivItemChgHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
