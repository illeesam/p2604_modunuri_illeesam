package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleConfigService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle-config")
@RequiredArgsConstructor
public class StSettleConfigController {

    private final StSettleConfigService service;

    /* 정산 설정 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfigDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 설정 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleConfigDto.Item>>> list(@Valid @ModelAttribute StSettleConfigDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 설정 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleConfigDto.PageResponse>> page(@Valid @ModelAttribute StSettleConfigDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 설정 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleConfig>> create(@RequestBody StSettleConfig entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 설정 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfig>> save(@PathVariable("id") String id, @RequestBody StSettleConfig entity) {
        entity.setSettleConfigId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 정산 설정 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleConfig>> updateSelective(@PathVariable("id") String id, @RequestBody StSettleConfig entity) {
        entity.setSettleConfigId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 설정 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 정산 설정 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StSettleConfig> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
