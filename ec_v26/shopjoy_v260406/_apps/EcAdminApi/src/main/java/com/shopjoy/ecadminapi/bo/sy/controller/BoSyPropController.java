package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.service.SyPropService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 시스템속성 API — /api/bo/sy/prop
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/prop")
@RequiredArgsConstructor
public class BoSyPropController {
    private final SyPropService syPropService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPropDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syPropService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyPropDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syPropService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPropDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(syPropService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyProp>> create(@RequestBody SyProp body) {
        return ResponseEntity.status(201).body(ApiResponse.created(syPropService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyProp>> update(@PathVariable("id") String id, @RequestBody SyProp body) {
        body.setPropId(id);
        return ResponseEntity.ok(ApiResponse.ok(syPropService.save(body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        syPropService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyProp> rows) {
        syPropService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
