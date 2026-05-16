package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/event")
@RequiredArgsConstructor
public class PmEventController {

    private final PmEventService service;

    /* 이벤트 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEventDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 이벤트 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmEventDto.Item>>> list(@Valid @ModelAttribute PmEventDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 이벤트 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmEventDto.PageResponse>> page(@Valid @ModelAttribute PmEventDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 이벤트 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmEvent>> create(@RequestBody PmEvent entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 이벤트 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEvent>> save(@PathVariable("id") String id, @RequestBody PmEvent entity) {
        entity.setEventId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* 이벤트 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmEvent>> updateSelective(@PathVariable("id") String id, @RequestBody PmEvent entity) {
        entity.setEventId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 이벤트 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /* 이벤트 목록저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmEvent> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
