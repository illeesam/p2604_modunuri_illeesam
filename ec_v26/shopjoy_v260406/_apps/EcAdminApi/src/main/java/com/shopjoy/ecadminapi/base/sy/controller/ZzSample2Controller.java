package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.sy.service.ZzSample2Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/zz-sample2")
@RequiredArgsConstructor
public class ZzSample2Controller {

    private final ZzSample2Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSample2Dto>>> list(
            @RequestParam Map<String, Object> p) {
        List<ZzSample2Dto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<ZzSample2Dto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<ZzSample2Dto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample2Dto>> getById(@PathVariable("id") String id) {
        ZzSample2Dto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSample2>> create(@RequestBody ZzSample2 entity) {
        ZzSample2 result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** save — 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample2>> save(
            @PathVariable("id") String id, @RequestBody ZzSample2 entity) {
        entity.setSample2Id(id);
        ZzSample2 result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** update — 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable("id") String id, @RequestBody ZzSample2 entity) {
        entity.setSample2Id(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
