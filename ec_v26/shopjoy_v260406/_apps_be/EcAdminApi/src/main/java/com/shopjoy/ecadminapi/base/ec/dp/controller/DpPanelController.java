package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpPanelService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/dp/panel")
@RequiredArgsConstructor
public class DpPanelController {

    private final DpPanelService service;

    /* 전시 패널 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanelDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 전시 패널 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DpPanelDto.Item>>> list(@Valid @ModelAttribute DpPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 전시 패널 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<DpPanelDto.PageResponse>> page(@Valid @ModelAttribute DpPanelDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 전시 패널 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<DpPanel>> create(@RequestBody DpPanel entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 전시 패널 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanel>> save(@PathVariable("id") String id, @RequestBody DpPanel entity) {
        entity.setPanelId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 전시 패널 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DpPanel>> updateSelective(@PathVariable("id") String id, @RequestBody DpPanel entity) {
        entity.setPanelId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 전시 패널 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (기본) */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<DpPanel>> saveDefault(@RequestBody DpPanel entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity), "저장되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<DpPanel>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody DpPanel entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (기본) */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<DpPanel> rows) {
        service.saveList("base", rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<DpPanel> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
