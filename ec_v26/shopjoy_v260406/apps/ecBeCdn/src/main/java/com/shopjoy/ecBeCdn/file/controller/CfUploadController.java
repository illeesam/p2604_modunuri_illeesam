package com.shopjoy.ecBeCdn.file.controller;

import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import com.shopjoy.ecBeCdn.file.dto.CfUploadResponse;
import com.shopjoy.ecBeCdn.file.entity.CfFile;
import com.shopjoy.ecBeCdn.file.service.CfFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 업로드/삭제 — SecurityConfig 가 /api/cdn/** 를 permitAll 로 열어둬서 로그인 없이 호출 가능
 * (2026-09-06, 관리 화면 요청사항). accessToken 을 실어 보내도 무방하지만 강제되지 않는다.
 * EcAdminApi 가 최종 사용자로부터 받은 파일을 그대로 이 엔드포인트로 넘긴다("EcAdminApi 에 파일
 * 업로드되고 EcCdnApi 에 업로드 요청" — 요청사항의 프록시 구조).
 */
@RestController
@RequestMapping("/api/cdn")
@RequiredArgsConstructor
public class CfUploadController {

    private final CfFileService cfFileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CfUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "thumbnail", defaultValue = "false") boolean thumbnail,
            Authentication authentication) {
        String clientId = authentication != null ? String.valueOf(authentication.getPrincipal()) : null;
        CfFile saved = cfFileService.upload(file, thumbnail, clientId);
        return ApiResponse.created(toResponse(saved));
    }

    @DeleteMapping("/file/{fileId}")
    public ApiResponse<Void> delete(@PathVariable String fileId) {
        cfFileService.delete(fileId);
        return ApiResponse.ok(null, "삭제되었습니다.");
    }

    /** 상대경로만 내려준다 — 호스트/스킴은 호출측(EcAdminApi)이나 프론트가 자기 기준으로 붙인다. */
    private CfUploadResponse toResponse(CfFile f) {
        boolean isVideo = "VIDEO".equals(f.getMediaTypeCd());
        return new CfUploadResponse(
            f.getFileId(),
            f.getOrigFileNm(),
            f.getMediaTypeCd(),
            f.getFileSize(),
            "/api/cdn/serve/file/" + f.getFileId(),
            f.getThumbnailPath() != null ? "/api/cdn/serve/thumbnail/" + f.getFileId() : null,
            f.getFramePath() != null ? "/api/cdn/serve/frame/" + f.getFileId() : null,
            isVideo ? "/api/cdn/serve/stream/" + f.getFileId() : null
        );
    }
}
