package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachSortDto;
import com.shopjoy.ecadminapi.co.cm.service.CmUploadService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/// 파일 업로드 API (다중 파일 + 썸네일 + DB 저장)
@RestController
@RequestMapping("/api/co/cm/upload")
@RequiredArgsConstructor
public class CmUploadMultiController {

    private final CmUploadService cmUploadService;

    /// 다중 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장). 항상 미연계 상태로 업로드된다 —
    /// 실제 연계(ref_table_nm/ref_id)는 대상 레코드를 저장하는 업무 API(create/update)의
    /// attachChanges 로 함께 반영된다.
    @PostMapping("/multi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMulti(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "businessCode", defaultValue = "common") String businessCode) {
        Map<String, Object> result = cmUploadService.uploadMulti(files, businessCode);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /// 첨부 파일 단건 조회 — 그룹/ref 없이 attachId 하나만 직접 참조하는 화면용(예: 프로필 이미지)
    @GetMapping("/attach/{attachId}")
    public ResponseEntity<ApiResponse<SyAttachDto.Item>> getAttachById(
            @PathVariable("attachId") String attachId) {
        return ResponseEntity.ok(ApiResponse.ok(cmUploadService.getAttachById(attachId)));
    }

    /// 관련테이블명/관련ID로 파일 목록 조회
    @GetMapping("/ref/files")
    public ResponseEntity<ApiResponse<List<SyAttachDto.Item>>> getRefFiles(
            @RequestParam("refTableNm") String refTableNm,
            @RequestParam("refId") String refId) {
        return ResponseEntity.ok(ApiResponse.ok(cmUploadService.getRefFiles(refTableNm, refId)));
    }

    /// 첨부 파일 단건 삭제 (DB + 실제 파일)
    @DeleteMapping("/attach/{attachId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttach(
            @PathVariable("attachId") String attachId) {
        cmUploadService.deleteAttach(attachId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /// 첨부 파일 정렬 순서 변경
    @PatchMapping("/attach/{attachId}/sort")
    public ResponseEntity<ApiResponse<Void>> updateAttachSort(
            @PathVariable("attachId") String attachId,
            @RequestBody SyAttachSortDto.Request req) {
        if (req == null || req.getSortOrd() == null)
            throw new com.shopjoy.ecadminapi.common.exception.CmBizException("sortOrd 값이 필요합니다.");
        cmUploadService.updateAttachSort(attachId, req.getSortOrd());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
