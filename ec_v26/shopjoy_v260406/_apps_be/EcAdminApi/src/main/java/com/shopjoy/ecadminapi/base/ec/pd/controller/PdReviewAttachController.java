package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdReviewAttachService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/base/ec/pd/review-attach")
@RequiredArgsConstructor
public class PdReviewAttachController {

    private final PdReviewAttachService service;

    /* 리뷰 첨부파일 키조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewAttachDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    /* 리뷰 첨부파일 목록조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PdReviewAttachDto.Item>>> list(@Valid @ModelAttribute PdReviewAttachDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(req)));
    }

    /* 리뷰 첨부파일 페이지조회 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PdReviewAttachDto.PageResponse>> page(@Valid @ModelAttribute PdReviewAttachDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(req)));
    }

    /* 리뷰 첨부파일 등록 */
    @PostMapping
    public ResponseEntity<ApiResponse<PdReviewAttach>> create(@RequestBody PdReviewAttach entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* 리뷰 첨부파일 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewAttach>> save(@PathVariable("id") String id, @RequestBody PdReviewAttach entity) {
        entity.setReviewAttachId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.saveOneBase(entity)));
    }

    /* 리뷰 첨부파일 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<PdReviewAttach>> updateSelective(@PathVariable("id") String id, @RequestBody PdReviewAttach entity) {
        entity.setReviewAttachId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.updateSelective(entity)));
    }

    /* 리뷰 첨부파일 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** save -- rowStatus 단건 분기 저장 (cmd 변형) */
    @PostMapping("/save/{cmd}")
    public ResponseEntity<ApiResponse<PdReviewAttach>> saveOneCmd(
            @PathVariable("cmd") String cmd, @RequestBody PdReviewAttach entity) {
        PdReviewAttach result = switch (cmd) {
            case "base" -> service.saveOneBase(entity);
            default -> throw new CmBizException("알 수 없는 save cmd: " + cmd);
        };
        return ResponseEntity.ok(ApiResponse.ok(result, "저장되었습니다."));
    }

    /** saveList -- 일괄 저장 (cmd 변형) */
    @PostMapping("/save-list/{cmd}")
    public ResponseEntity<ApiResponse<Void>> saveListCmd(
            @PathVariable("cmd") String cmd, @RequestBody List<PdReviewAttach> rows) {
        switch (cmd) {
            case "base" -> service.saveListBase(rows);
            default -> throw new CmBizException("알 수 없는 saveList cmd: " + cmd);
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
