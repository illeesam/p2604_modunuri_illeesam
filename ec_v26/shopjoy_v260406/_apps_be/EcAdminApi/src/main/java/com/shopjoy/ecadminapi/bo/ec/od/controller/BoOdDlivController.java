package com.shopjoy.ecadminapi.bo.ec.od.controller;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.bo.ec.od.service.BoOdDlivService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 배송 API
 * GET    /api/bo/ec/od/dliv       — 목록
 * GET    /api/bo/ec/od/dliv/page  — 페이징
 * GET    /api/bo/ec/od/dliv/{id}  — 단건
 * POST   /api/bo/ec/od/dliv       — 등록
 * PUT    /api/bo/ec/od/dliv/{id}  — 수정
 * DELETE /api/bo/ec/od/dliv/{id}  — 삭제
 * PATCH  /api/bo/ec/od/dliv/{id}/status — 상태변경
 *
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/od/dliv")
@RequiredArgsConstructor
public class BoOdDlivController {
    private final BoOdDlivService boOdDlivService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OdDlivDto.Item>>> list(@Valid @ModelAttribute OdDlivDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdDlivService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<OdDlivDto.PageResponse>> page(@Valid @ModelAttribute OdDlivDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boOdDlivService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDlivDto.Item>> getById(@PathVariable("id") String id) {
        OdDlivDto.Item result = boOdDlivService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<OdDliv>> create(@RequestBody OdDliv body) {
        OdDliv result = boOdDlivService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDliv>> update(@PathVariable("id") String id, @RequestBody OdDliv body) {
        OdDliv result = boOdDlivService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<OdDliv>> upsert(@PathVariable("id") String id, @RequestBody OdDliv body) {
        return ResponseEntity.ok(ApiResponse.ok(boOdDlivService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boOdDlivService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- 단건 저장 (cmd 변형: status 등) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<OdDlivDto.Item>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody OdDliv entity) {
        OdDlivDto.Item result = switch (cmd) {
            case "status" -> boOdDlivService.saveOneStatus(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형: status/courier/approval/approvalReq 등) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<OdDliv> rows) {
        switch (cmd) {
            case "base" -> boOdDlivService.saveListBase(rows);
            case "status" -> boOdDlivService.saveListStatus(rows);
            case "courier" -> boOdDlivService.saveListCourier(rows);
            case "approval" -> boOdDlivService.saveListApproval(rows);
            case "approvalReq" -> boOdDlivService.saveListApprovalReq(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}