package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/save")
@RequiredArgsConstructor
public class PmSaveController {

    private final PmSaveService service;

    /* 적립금 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 적립금 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveDto.Item>>> list(@Valid @ModelAttribute PmSaveDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 적립금 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmSaveDto.PageResponse>> page(@Valid @ModelAttribute PmSaveDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 적립금 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSave>> create(@RequestBody PmSave entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 적립금 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSave>> save(@PathVariable("id") String id, @RequestBody PmSave entity) {
        entity.setSaveId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 적립금 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSave>> updateSelective(@PathVariable("id") String id, @RequestBody PmSave entity) {
        entity.setSaveId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 적립금 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 적립금 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmSave> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
