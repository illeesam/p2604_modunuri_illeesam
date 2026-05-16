package com.shopjoy.ecadminapi.base.ec.st.controller;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleCloseService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/st/settle-close")
@RequiredArgsConstructor
public class StSettleCloseController {

    private final StSettleCloseService service;

    /* 정산 마감 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleCloseDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 정산 마감 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StSettleCloseDto.Item>>> list(@Valid @ModelAttribute StSettleCloseDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 정산 마감 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<StSettleCloseDto.PageResponse>> page(@Valid @ModelAttribute StSettleCloseDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 정산 마감 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<StSettleClose>> create(@RequestBody StSettleClose entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 정산 마감 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleClose>> save(@PathVariable("id") String id, @RequestBody StSettleClose entity) {
        entity.setSettleCloseId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 정산 마감 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<StSettleClose>> updateSelective(@PathVariable("id") String id, @RequestBody StSettleClose entity) {
        entity.setSettleCloseId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 정산 마감 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 정산 마감 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<StSettleClose> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
