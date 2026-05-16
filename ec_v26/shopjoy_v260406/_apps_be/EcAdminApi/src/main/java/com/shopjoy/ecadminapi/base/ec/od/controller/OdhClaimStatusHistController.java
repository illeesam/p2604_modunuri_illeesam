package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhClaimStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/claim-status-hist")
@RequiredArgsConstructor
public class OdhClaimStatusHistController {

    private final OdhClaimStatusHistService service;

    /* 클레임 상태 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 클레임 상태 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimStatusHistDto.Item>>> list(@Valid @ModelAttribute OdhClaimStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 클레임 상태 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhClaimStatusHistDto.PageResponse>> page(@Valid @ModelAttribute OdhClaimStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 클레임 상태 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhClaimStatusHist>> create(@RequestBody OdhClaimStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 클레임 상태 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimStatusHist>> save(@PathVariable("id") String id, @RequestBody OdhClaimStatusHist entity) {
        entity.setClaimStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 클레임 상태 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimStatusHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhClaimStatusHist entity) {
        entity.setClaimStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 클레임 상태 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 클레임 상태 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhClaimStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
