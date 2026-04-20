package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyMenuService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 메뉴 API — /api/bo/sy/menu
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/menu")
@RequiredArgsConstructor
@UserOnly
public class BoSyMenuController {
    private final BoSyMenuService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyMenuDto>>> list(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        List<SyMenuDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyMenuDto>>> page(
            @RequestParam Map<String, Object> p) {
        CmUtil.require(p, "siteId");
        PageResult<SyMenuDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyMenu>> create(@RequestBody SyMenu body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyMenuDto>> update(@PathVariable String id, @RequestBody SyMenu body) {
        SyMenuDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
