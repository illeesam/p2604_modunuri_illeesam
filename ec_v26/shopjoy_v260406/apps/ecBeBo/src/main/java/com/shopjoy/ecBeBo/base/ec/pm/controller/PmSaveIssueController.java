package com.shopjoy.ecBeBo.base.ec.pm.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecBeBo.base.ec.pm.service.PmSaveIssueService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
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
    public ResponseEntity<ApiResponse<BasePage<PmSaveIssueDto.Item>>> page(@Valid @ModelAttribute PmSaveIssueDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 적립금 지급 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSaveIssue>> create(@Valid @RequestBody PmSaveIssue entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 적립금 지급 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveIssue>> save(@PathVariable("id") String id, @Valid @RequestBody PmSaveIssue entity) {
        entity.setSaveIssueId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 적립금 지급 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveIssue>> updateSelective(@PathVariable("id") String id, @Valid @RequestBody PmSaveIssue entity) {
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
    public ResponseEntity<ApiResponse<PmSaveIssue>> saveOneCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody PmSaveIssue entity) {
        PmSaveIssue result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @Valid @RequestBody List<PmSaveIssue> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
