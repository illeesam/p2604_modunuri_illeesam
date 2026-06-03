package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.service.SyMenuService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
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

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<SyMenu>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody SyMenu entity) {
        SyMenu result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<SyMenu> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
