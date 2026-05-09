package com.shopjoy.ecadminapi.base.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.service.OdDlivService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/od/dliv")
@RequiredArgsConstructor
public class OdDlivController {

    private final OdDlivService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OdDlivDto.Item>>> list(@Valid @ModelAttribute OdDlivDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdDlivDto.PageResponse>> page(@Valid @ModelAttribute OdDlivDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OdDliv>> create(@RequestBody OdDliv entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDliv>> save(@PathVariable("id") String id, @RequestBody OdDliv entity) {
        entity.setDlivId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDliv>> updatePartial(@PathVariable("id") String id, @RequestBody OdDliv entity) {
        entity.setDlivId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updatePartial(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<OdDliv> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
