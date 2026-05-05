package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
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

    /// 다중 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장)
    @PostMapping("/multi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMulti(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "businessCode", defaultValue = "common") String businessCode,
            @RequestParam(value = "grpNm", defaultValue = "") String grpNm,
            @RequestParam(value = "attachGrpId", required = false) String attachGrpId) {
        Map<String, Object> result = cmUploadService.uploadMulti(files, businessCode, grpNm, attachGrpId);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /// 첨부 그룹 ID로 파일 목록 조회
    @GetMapping("/attach-grp/{attachGrpId}/files")
    public ResponseEntity<ApiResponse<List<SyAttachDto>>> getAttachGrpFiles(
            @PathVariable("attachGrpId") String attachGrpId) {
        return ResponseEntity.ok(ApiResponse.ok(cmUploadService.getAttachGrpFiles(attachGrpId)));
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
            @RequestBody Map<String, Object> body) {
        Integer sortOrd = body.get("sortOrd") instanceof Number n ? n.intValue() : null;
        if (sortOrd == null) throw new com.shopjoy.ecadminapi.common.exception.CmBizException("sortOrd 값이 필요합니다.");
        cmUploadService.updateAttachSort(attachId, sortOrd);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
