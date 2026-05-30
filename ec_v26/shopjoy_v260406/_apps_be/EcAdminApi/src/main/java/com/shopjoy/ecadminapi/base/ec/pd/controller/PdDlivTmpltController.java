package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdDlivTmpltService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/dliv-tmplt")
@RequiredArgsConstructor
public class PdDlivTmpltController {

    private final PdDlivTmpltService service;

    /* 배송 템플릿 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmpltDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 배송 템플릿 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdDlivTmpltDto.Item>>> list(@Valid @ModelAttribute PdDlivTmpltDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 배송 템플릿 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdDlivTmpltDto.PageResponse>> page(@Valid @ModelAttribute PdDlivTmpltDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 배송 템플릿 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdDlivTmplt>> create(@RequestBody PdDlivTmplt entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 배송 템플릿 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmplt>> save(@PathVariable("id") String id, @RequestBody PdDlivTmplt entity) {
        entity.setDlivTmpltId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 배송 템플릿 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdDlivTmplt>> updateSelective(@PathVariable("id") String id, @RequestBody PdDlivTmplt entity) {
        entity.setDlivTmpltId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 배송 템플릿 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<PdDlivTmplt>> saveDefault(@RequestBody PdDlivTmplt entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdDlivTmplt>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdDlivTmplt entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PdDlivTmplt> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdDlivTmplt> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
