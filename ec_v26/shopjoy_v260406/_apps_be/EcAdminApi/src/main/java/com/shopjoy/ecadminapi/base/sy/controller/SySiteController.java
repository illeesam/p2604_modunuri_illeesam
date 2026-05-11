package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.service.SySiteService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/site")
@RequiredArgsConstructor
public class SySiteController {

    private final SySiteService service;

    /** getById — 단건조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SySiteDto.Item>> getById(@PathVariable("id") String id) {
        SySiteDto.Item result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** list — 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SySiteDto.Item>>> list(@Valid @ModelAttribute SySiteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /** page — 페이징조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SySiteDto.PageResponse>> page(@Valid @ModelAttribute SySiteDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /** create — 생성 (JPA) */
    @PostMapping
    public ResponseEntity<ApiResponse<SySite>> create(@RequestBody SySite entity) {
        SySite result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** save — 전체 수정 (JPA) */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SySite>> save(
            @PathVariable("id") String id, @RequestBody SySite entity) {
        entity.setSiteId(id);
        SySite result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** updateSelective — 선택 필드 수정 (MyBatis selective) */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SySite>> updateSelective(
            @PathVariable("id") String id, @RequestBody SySite entity) {
        entity.setSiteId(id);
        SySite result = service.updateSelective(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 일괄 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SySite> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
