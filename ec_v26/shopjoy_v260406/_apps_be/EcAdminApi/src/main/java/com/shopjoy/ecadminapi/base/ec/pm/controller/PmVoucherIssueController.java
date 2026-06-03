package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmVoucherIssueService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pm/voucher-issue")
@RequiredArgsConstructor
public class PmVoucherIssueController {

    private final PmVoucherIssueService service;

    /* 바우처(상품권) 발행 이력 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherIssueDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 바우처(상품권) 발행 이력 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmVoucherIssueDto.Item>>> list(@Valid @ModelAttribute PmVoucherIssueDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 바우처(상품권) 발행 이력 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmVoucherIssueDto.PageResponse>> page(@Valid @ModelAttribute PmVoucherIssueDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 바우처(상품권) 발행 이력 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmVoucherIssue>> create(@RequestBody PmVoucherIssue entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 바우처(상품권) 발행 이력 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherIssue>> save(@PathVariable("id") String id, @RequestBody PmVoucherIssue entity) {
        entity.setVoucherIssueId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 바우처(상품권) 발행 이력 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PmVoucherIssue>> updateSelective(@PathVariable("id") String id, @RequestBody PmVoucherIssue entity) {
        entity.setVoucherIssueId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 바우처(상품권) 발행 이력 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PmVoucherIssue>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PmVoucherIssue entity) {
        PmVoucherIssue result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PmVoucherIssue> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
