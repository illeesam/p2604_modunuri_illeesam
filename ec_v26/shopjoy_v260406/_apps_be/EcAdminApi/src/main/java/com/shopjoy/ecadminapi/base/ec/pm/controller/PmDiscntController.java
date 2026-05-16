package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/discnt")
@RequiredArgsConstructor
public class PmDiscntController {

    private final PmDiscntService service;

    /* 할인 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscntDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 할인 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmDiscntDto.Item>>> list(@Valid @ModelAttribute PmDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 할인 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmDiscntDto.PageResponse>> page(@Valid @ModelAttribute PmDiscntDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 할인 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmDiscnt>> create(@RequestBody PmDiscnt entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 할인 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscnt>> save(@PathVariable("id") String id, @RequestBody PmDiscnt entity) {
        entity.setDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 할인 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmDiscnt>> updateSelective(@PathVariable("id") String id, @RequestBody PmDiscnt entity) {
        entity.setDiscntId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 할인 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 할인 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmDiscnt> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
