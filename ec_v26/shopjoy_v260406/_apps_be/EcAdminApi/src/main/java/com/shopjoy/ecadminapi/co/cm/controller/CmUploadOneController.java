package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.co.cm.service.CmUploadService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/// 파일 업로드 API (단일 파일 + 썸네일 + DB 저장)
@RestController
@RequestMapping("/api/co/cm/upload")
@RequiredArgsConstructor
public class CmUploadOneController {

    private final CmUploadService cmUploadService;

    /// 단일 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장)
    @PostMapping("/one")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadOne(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "businessCode", defaultValue = "common") String businessCode,
            @RequestParam(value = "createThumbnail", defaultValue = "false") boolean createThumbnail,
            @RequestParam(value = "attachGrpId", required = false) String attachGrpId) {
        Map<String, Object> result = cmUploadService.uploadOne(file, businessCode, createThumbnail, attachGrpId);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }
}
