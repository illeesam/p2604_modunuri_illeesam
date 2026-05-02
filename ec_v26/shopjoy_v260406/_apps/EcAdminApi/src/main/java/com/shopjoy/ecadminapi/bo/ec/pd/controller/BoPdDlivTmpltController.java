package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdDlivTmpltService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 배송템플릿 API — /api/bo/ec/pd/dliv-tmplt
 */
@RestController
@RequestMapping("/api/bo/ec/pd/dliv-tmplt")
@RequiredArgsConstructor
public class BoPdDlivTmpltController {
    private final BoPdDlivTmpltService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdDlivTmpltDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdDlivTmpltDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmpltDto>> getById(@PathVariable String id) {
        PdDlivTmpltDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PdDlivTmplt>> create(@RequestBody PdDlivTmplt body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmpltDto>> update(@PathVariable String id, @RequestBody PdDlivTmplt body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmpltDto>> upsert(@PathVariable String id, @RequestBody PdDlivTmplt body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdDlivTmplt> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
