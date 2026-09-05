package com.shopjoy.eccdnapi.file.controller;

import com.shopjoy.eccdnapi.common.exception.CfBizException;
import com.shopjoy.eccdnapi.file.entity.CfFile;
import com.shopjoy.eccdnapi.file.service.CfFileService;
import com.shopjoy.eccdnapi.file.service.CfStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 원본/썸네일/동영상 첫프레임 정적 서빙 — 전부 permitAll(SecurityConfig). 브라우저가 &lt;img
 * src&gt;/&lt;video poster&gt; 로 직접 요청하는 경로라 accessToken 이 있으면 안 된다.
 * 파일명이 UUID 기반이라 재사용될 일이 없으므로 영구 캐시(immutable) 헤더를 붙인다.
 */
@RestController
@RequestMapping("/api/cdn/serve")
@RequiredArgsConstructor
public class CfFileServeController {

    private final CfFileService cfFileService;
    private final CfStorageService cfStorageService;

    @GetMapping("/file/{fileId}")
    public ResponseEntity<Resource> file(@PathVariable String fileId) {
        CfFile f = cfFileService.getOrThrow(fileId);
        return serve(f.getFilePath(), f.getContentType());
    }

    @GetMapping("/thumbnail/{fileId}")
    public ResponseEntity<Resource> thumbnail(@PathVariable String fileId) {
        CfFile f = cfFileService.getOrThrow(fileId);
        if (f.getThumbnailPath() == null) throw new CfBizException("썸네일이 없는 파일입니다: " + fileId);
        return serve(f.getThumbnailPath(), MediaType.IMAGE_JPEG_VALUE);
    }

    @GetMapping("/frame/{fileId}")
    public ResponseEntity<Resource> frame(@PathVariable String fileId) {
        CfFile f = cfFileService.getOrThrow(fileId);
        if (f.getFramePath() == null) throw new CfBizException("동영상 첫 프레임 이미지가 없는 파일입니다: " + fileId);
        return serve(f.getFramePath(), MediaType.IMAGE_JPEG_VALUE);
    }

    private ResponseEntity<Resource> serve(String relativePath, String contentType) {
        Path path = cfStorageService.resolve(relativePath);
        if (!Files.exists(path)) throw new CfBizException("파일을 찾을 수 없습니다(디스크에 없음): " + relativePath);
        Resource resource = new FileSystemResource(path);
        MediaType mt = (contentType != null && !contentType.isBlank())
            ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
            .contentType(mt)
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
            .body(resource);
    }
}
