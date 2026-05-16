package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.service.StReconService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/recon")
@RequiredArgsConstructor
public class StReconController {

    private final StReconService service;

    /* 정산 대사(Reconciliation) 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StReconDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 대사(Reconciliation) 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StReconDto.Item>>> list(@Valid @ModelAttribute StReconDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 대사(Reconciliation) 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StReconDto.PageResponse>> page(@Valid @ModelAttribute StReconDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 대사(Reconciliation) 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StRecon>> create(@RequestBody StRecon entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 대사(Reconciliation) 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StRecon>> save(@PathVariable("id") String id, @RequestBody StRecon entity) {
        entity.setReconId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 정산 대사(Reconciliation) 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StRecon>> updateSelective(@PathVariable("id") String id, @RequestBody StRecon entity) {
        entity.setReconId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 대사(Reconciliation) 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 정산 대사(Reconciliation) 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StRecon> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
