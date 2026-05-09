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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhPayStatusHistDto.Item>>> list(@Valid @ModelAttribute OdhPayStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhPayStatusHistDto.PageResponse>> page(@Valid @ModelAttribute OdhPayStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdhPayStatusHist>> create(@RequestBody OdhPayStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayStatusHist>> save(@PathVariable("id") String id, @RequestBody OdhPayStatusHist entity) {
        entity.setPayStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhPayStatusHist>> updatePartial(@PathVariable("id") String id, @RequestBody OdhPayStatusHist entity) {
        entity.setPayStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhPayStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
