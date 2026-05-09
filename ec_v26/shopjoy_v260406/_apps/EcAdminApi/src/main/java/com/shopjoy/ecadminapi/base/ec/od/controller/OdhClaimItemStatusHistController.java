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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhClaimItemStatusHistDto.Item>>> list(@Valid @ModelAttribute OdhClaimItemStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHistDto.PageResponse>> page(@Valid @ModelAttribute OdhClaimItemStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHist>> create(@RequestBody OdhClaimItemStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHist>> save(@PathVariable("id") String id, @RequestBody OdhClaimItemStatusHist entity) {
        entity.setClaimItemStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhClaimItemStatusHist>> updatePartial(@PathVariable("id") String id, @RequestBody OdhClaimItemStatusHist entity) {
        entity.setClaimItemStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhClaimItemStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
