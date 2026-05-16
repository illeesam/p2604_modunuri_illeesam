package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhPayStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/pay-status-hist")
@RequiredArgsConstructor
public class OdhPayStatusHistController {

    private final OdhPayStatusHistService service;

    /* 결제 상태 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 결제 상태 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhPayStatusHistDto.Item>>> list(@Valid @ModelAttribute OdhPayStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 결제 상태 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhPayStatusHistDto.PageResponse>> page(@Valid @ModelAttribute OdhPayStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 결제 상태 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhPayStatusHist>> create(@RequestBody OdhPayStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 결제 상태 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayStatusHist>> save(@PathVariable("id") String id, @RequestBody OdhPayStatusHist entity) {
        entity.setPayStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 결제 상태 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayStatusHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhPayStatusHist entity) {
        entity.setPayStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 결제 상태 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 결제 상태 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhPayStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
