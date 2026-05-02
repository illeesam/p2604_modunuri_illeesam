package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.service.SyCodeGrpService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 공통코드그룹 API — /api/bo/sy/code-grp
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/code-grp")
@RequiredArgsConstructor
public class BoSyCodeGrpController {
    private final SyCodeGrpService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyCodeGrpDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyCodeGrpDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrpDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyCodeGrp>> create(@RequestBody SyCodeGrp body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyCodeGrp>> update(@PathVariable String id, @RequestBody SyCodeGrp body) {
        body.setCodeGrpId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyCodeGrp> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
