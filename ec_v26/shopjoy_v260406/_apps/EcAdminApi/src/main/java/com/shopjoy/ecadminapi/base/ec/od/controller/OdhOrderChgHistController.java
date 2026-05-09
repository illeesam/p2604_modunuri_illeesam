package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.service.OdhOrderChgHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/order-chg-hist")
@RequiredArgsConstructor
public class OdhOrderChgHistController {

    private final OdhOrderChgHistService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderChgHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdhOrderChgHistDto.Item>>> list(@Valid @ModelAttribute OdhOrderChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdhOrderChgHistDto.PageResponse>> page(@Valid @ModelAttribute OdhOrderChgHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdhOrderChgHist>> create(@RequestBody OdhOrderChgHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderChgHist>> save(@PathVariable("id") String id, @RequestBody OdhOrderChgHist entity) {
        entity.setOrderChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdhOrderChgHist>> updatePartial(@PathVariable("id") String id, @RequestBody OdhOrderChgHist entity) {
        entity.setOrderChgHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdhOrderChgHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
