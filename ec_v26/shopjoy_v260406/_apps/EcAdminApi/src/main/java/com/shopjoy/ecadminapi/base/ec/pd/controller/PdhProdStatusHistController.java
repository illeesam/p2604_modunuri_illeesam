package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdStatusHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-status-hist")
@RequiredArgsConstructor
public class PdhProdStatusHistController {

    private final PdhProdStatusHistService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHistDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdStatusHistDto.Item>>> list(@Valid @ModelAttribute PdhProdStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdhProdStatusHistDto.PageResponse>> page(@Valid @ModelAttribute PdhProdStatusHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdhProdStatusHist>> create(@RequestBody PdhProdStatusHist entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHist>> save(@PathVariable("id") String id, @RequestBody PdhProdStatusHist entity) {
        entity.setProdStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdStatusHist>> updatePartial(@PathVariable("id") String id, @RequestBody PdhProdStatusHist entity) {
        entity.setProdStatusHistId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdhProdStatusHist> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
