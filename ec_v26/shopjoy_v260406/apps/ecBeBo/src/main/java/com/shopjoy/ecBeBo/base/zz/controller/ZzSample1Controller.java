package com.shopjoy.ecBeBo.base.zz.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.zz.data.dto.ZzSample1Dto;
import com.shopjoy.ecBeBo.base.zz.data.entity.ZzSample1;
import com.shopjoy.ecBeBo.base.zz.service.ZzSample1Service;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/zz-sample1")
@RequiredArgsConstructor
public class ZzSample1Controller {

    private final ZzSample1Service service;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSample1Dto.Item>>> list(@Valid @ModelAttribute ZzSample1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<ZzSample1Dto.Item>>> page(@Valid @ModelAttribute ZzSample1Dto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample1Dto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ZzSample1>> create(@Valid @RequestBody ZzSample1 entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample1>> update(
            @PathVariable("id") String id, @Valid @RequestBody ZzSample1 entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, entity)));
    }

    /** updateSelective — 부분 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> updateSelective(
            @PathVariable("id") String id, @Valid @RequestBody ZzSample1 entity) {
        entity.setSample1Id(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
