package com.shopjoy.ecadminapi.base.ec.cm.controller;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmPathService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/cm/path")
@RequiredArgsConstructor
public class CmPathController {

    private final CmPathService service;

    /* 경로(메뉴/URL) 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CmPathDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 경로(메뉴/URL) 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CmPathDto.Item>>> list(@Valid @ModelAttribute CmPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 경로(메뉴/URL) 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<CmPathDto.PageResponse>> page(@Valid @ModelAttribute CmPathDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 경로(메뉴/URL) 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<CmPath>> create(@RequestBody CmPath entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 경로(메뉴/URL) 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CmPath>> save(@PathVariable("id") String id, @RequestBody CmPath entity) {
        entity.setBizCd(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 경로(메뉴/URL) 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CmPath>> updateSelective(@PathVariable("id") String id, @RequestBody CmPath entity) {
        entity.setBizCd(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 경로(메뉴/URL) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 경로(메뉴/URL) 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<CmPath> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
