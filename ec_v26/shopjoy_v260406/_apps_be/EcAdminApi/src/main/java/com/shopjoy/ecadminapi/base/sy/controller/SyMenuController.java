package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.service.SyMenuService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/sy/menu")
@RequiredArgsConstructor
public class SyMenuController {

    private final SyMenuService service;

    /* 메뉴 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyMenuDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 메뉴 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyMenuDto.Item>>> list(@Valid @ModelAttribute SyMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 메뉴 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<SyMenuDto.PageResponse>> page(@Valid @ModelAttribute SyMenuDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 메뉴 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyMenu>> create(@RequestBody SyMenu entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 메뉴 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyMenu>> save(@PathVariable("id") String id, @RequestBody SyMenu entity) {
        entity.setMenuId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 메뉴 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SyMenu>> updateSelective(@PathVariable("id") String id, @RequestBody SyMenu entity) {
        entity.setMenuId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 메뉴 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 메뉴 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyMenu> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
