package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.service.OdPayMethodService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/pay-method")
@RequiredArgsConstructor
public class OdPayMethodController {

    private final OdPayMethodService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPayMethodDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdPayMethodDto.Item>>> list(@Valid @ModelAttribute OdPayMethodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdPayMethodDto.PageResponse>> page(@Valid @ModelAttribute OdPayMethodDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdPayMethod>> create(@RequestBody OdPayMethod entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPayMethod>> save(@PathVariable("id") String id, @RequestBody OdPayMethod entity) {
        entity.setPayMethodId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdPayMethod>> updatePartial(@PathVariable("id") String id, @RequestBody OdPayMethod entity) {
        entity.setPayMethodId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdPayMethod> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
