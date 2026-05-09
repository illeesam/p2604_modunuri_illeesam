package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/prod-img")
@RequiredArgsConstructor
public class PdProdImgController {

    private final PdProdImgService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImgDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdProdImgDto.Item>>> list(@Valid @ModelAttribute PdProdImgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdProdImgDto.PageResponse>> page(@Valid @ModelAttribute PdProdImgDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdProdImg>> create(@RequestBody PdProdImg entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImg>> save(@PathVariable("id") String id, @RequestBody PdProdImg entity) {
        entity.setProdImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdProdImg>> updatePartial(@PathVariable("id") String id, @RequestBody PdProdImg entity) {
        entity.setProdImgId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdProdImg> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
