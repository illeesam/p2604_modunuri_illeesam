package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveIssueService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/save-issue")
@RequiredArgsConstructor
public class PmSaveIssueController {

    private final PmSaveIssueService service;

    /* 적립금 지급 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveIssueDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 적립금 지급 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveIssueDto.Item>>> list(@Valid @ModelAttribute PmSaveIssueDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 적립금 지급 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmSaveIssueDto.PageResponse>> page(@Valid @ModelAttribute PmSaveIssueDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 적립금 지급 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSaveIssue>> create(@RequestBody PmSaveIssue entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 적립금 지급 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveIssue>> save(@PathVariable("id") String id, @RequestBody PmSaveIssue entity) {
        entity.setSaveIssueId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save("base", entity)));
    }

    /* 적립금 지급 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveIssue>> updateSelective(@PathVariable("id") String id, @RequestBody PmSaveIssue entity) {
        entity.setSaveIssueId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 적립금 지급 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmSaveIssue>> saveCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmSaveIssue entity) {
        return ResponseEntity.ok(ApiResponse.ok(service.save(cmd, entity), "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmSaveIssue> rows) {
        service.saveList(cmd, rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
