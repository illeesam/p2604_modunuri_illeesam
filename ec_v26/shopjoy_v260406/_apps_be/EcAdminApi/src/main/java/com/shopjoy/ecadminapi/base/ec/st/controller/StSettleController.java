package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle")
@RequiredArgsConstructor
public class StSettleController {

    private final StSettleService service;

    /* 정산 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleDto.Item>>> list(@Valid @ModelAttribute StSettleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleDto.PageResponse>> page(@Valid @ModelAttribute StSettleDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettle>> create(@RequestBody StSettle entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettle>> save(@PathVariable("id") String id, @RequestBody StSettle entity) {
        entity.setSettleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 정산 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettle>> updateSelective(@PathVariable("id") String id, @RequestBody StSettle entity) {
        entity.setSettleId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 정산 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StSettle> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
