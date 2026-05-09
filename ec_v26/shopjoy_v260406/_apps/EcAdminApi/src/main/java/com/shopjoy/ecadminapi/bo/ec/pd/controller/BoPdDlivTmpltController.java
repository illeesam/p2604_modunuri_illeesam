package com.shopjoy.ecadminapi.bo.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.bo.ec.pd.service.BoPdDlivTmpltService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 배송템플릿 API — /api/bo/ec/pd/dliv-tmplt
 */
@RestController
@RequestMapping("/api/bo/ec/pd/dliv-tmplt")
@RequiredArgsConstructor
public class BoPdDlivTmpltController {
    private final BoPdDlivTmpltService boPdDlivTmpltService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdDlivTmpltDto.Item>>> list(@Valid @ModelAttribute PdDlivTmpltDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdDlivTmpltService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdDlivTmpltDto.PageResponse>> page(@Valid @ModelAttribute PdDlivTmpltDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPdDlivTmpltService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmpltDto.Item>> getById(@PathVariable("id") String id) {
        PdDlivTmpltDto.Item result = boPdDlivTmpltService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdDlivTmplt>> create(@RequestBody PdDlivTmplt body) {
        return ResponseEntity.status(201).body(ApiResponse.created(boPdDlivTmpltService.create(body)));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmplt>> update(@PathVariable("id") String id, @RequestBody PdDlivTmplt body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdDlivTmpltService.update(id, body)));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmplt>> upsert(@PathVariable("id") String id, @RequestBody PdDlivTmplt body) {
        return ResponseEntity.ok(ApiResponse.ok(boPdDlivTmpltService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPdDlivTmpltService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdDlivTmplt> rows) {
        boPdDlivTmpltService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
