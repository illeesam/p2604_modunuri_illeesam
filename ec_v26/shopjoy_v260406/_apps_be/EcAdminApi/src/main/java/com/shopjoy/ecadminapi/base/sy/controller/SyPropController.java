package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.service.SyPropService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/prop")
@RequiredArgsConstructor
public class SyPropController {

    private final SyPropService service;

    /* 시스템 속성 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPropDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 시스템 속성 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPropDto.Item>>> list(@Valid @ModelAttribute SyPropDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 시스템 속성 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyPropDto.PageResponse>> page(@Valid @ModelAttribute SyPropDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 시스템 속성 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyProp>> create(@RequestBody SyProp entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 시스템 속성 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyProp>> save(@PathVariable("id") String id, @RequestBody SyProp entity) {
        entity.setPropId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 시스템 속성 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyProp>> updateSelective(@PathVariable("id") String id, @RequestBody SyProp entity) {
        entity.setPropId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 시스템 속성 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 시스템 속성 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyProp> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
