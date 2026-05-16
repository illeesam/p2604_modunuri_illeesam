package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhClaimItemStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/claim-item-status-hist")
@RequiredArgsConstructor
public class OdhClaimItemStatusHistController {

    private final OdhClaimItemStatusHistService service;

    /* 클레임 아이템 상태 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 클레임 아이템 상태 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimItemStatusHistDto.Item>>> list(@Valid @ModelAttribute OdhClaimItemStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 클레임 아이템 상태 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHistDto.PageResponse>> page(@Valid @ModelAttribute OdhClaimItemStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 클레임 아이템 상태 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHist>> create(@RequestBody OdhClaimItemStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 클레임 아이템 상태 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHist>> save(@PathVariable("id") String id, @RequestBody OdhClaimItemStatusHist entity) {
        entity.setClaimItemStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 클레임 아이템 상태 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHist>> updateSelective(@PathVariable("id") String id, @RequestBody OdhClaimItemStatusHist entity) {
        entity.setClaimItemStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 클레임 아이템 상태 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 클레임 아이템 상태 이력 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhClaimItemStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
