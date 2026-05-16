package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleRawService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle-raw")
@RequiredArgsConstructor
public class StSettleRawController {

    private final StSettleRawService service;

    /* 정산 원천 데이터 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleRawDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 원천 데이터 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleRawDto.Item>>> list(@Valid @ModelAttribute StSettleRawDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 원천 데이터 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleRawDto.PageResponse>> page(@Valid @ModelAttribute StSettleRawDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 원천 데이터 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleRaw>> create(@RequestBody StSettleRaw entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 원천 데이터 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleRaw>> save(@PathVariable("id") String id, @RequestBody StSettleRaw entity) {
        entity.setSettleRawId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 정산 원천 데이터 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleRaw>> updateSelective(@PathVariable("id") String id, @RequestBody StSettleRaw entity) {
        entity.setSettleRawId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 원천 데이터 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 정산 원천 데이터 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StSettleRaw> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
