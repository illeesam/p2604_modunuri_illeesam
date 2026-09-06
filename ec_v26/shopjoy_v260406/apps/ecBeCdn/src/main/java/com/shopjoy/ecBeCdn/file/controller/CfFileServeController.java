package com.shopjoy.ecBeCdn.file.controller;

import com.shopjoy.ecBeCdn.common.exception.CfBizException;
import com.shopjoy.ecBeCdn.file.entity.CfFile;
import com.shopjoy.ecBeCdn.file.service.CfFileService;
import com.shopjoy.ecBeCdn.file.service.CfStorageService;
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

    /**
     * 경로 기반 직접 서빙 — /api/cdn/attach/** (요청사항: "경로방식의 접근을 요구하는거야").
     * cf_file DB 조회(fileId) 없이, storage-root(app.cf.storage-root=/app/storage/cdn, 이미
     * "cdn" 까지 포함) 기준 상대경로를 URL 경로 그대로("attach/" 다음 부분)로 노출한다 —
     * CfStorageBrowseController 의 /api/cdn/storage/raw?path=... 와 안전장치(resolveSafe)는
     * 동일, URL 형태만 쿼리스트링 대신 경로 방식. cf_file.file_path 도 storage-root 기준
     * 상대경로라 "attach/..." 로 저장돼 있다(실측 확인, "cdn/" 접두 없음).
     * 예) GET /api/cdn/attach/PROD_IMG/2026/202608/20260816/20260816_001537_03_6525.png
     *     → {storage-root}/attach/PROD_IMG/2026/202608/20260816/20260816_001537_03_6525.png
     *     → 실제 디스크: .../ecBeCdnStorage/cdn/attach/PROD_IMG/2026/.../20260816_001537_03_6525.png
     */
    @GetMapping("/attach/{*path}")
    public ResponseEntity<Resource> attach(@PathVariable String path) {
        // path 는 "{*path}" 캐치올 특성상 선행 '/' 를 포함해서 들어온다(예: "/PROD_IMG/2026/.../a.png").
        String rel = "attach" + path;
        Path target = cfStorageService.resolveSafe(rel);
        if (!Files.exists(target) || !Files.isRegularFile(target)) {
            throw new CfBizException("파일을 찾을 수 없습니다: " + rel);
        }
        Resource resource = new FileSystemResource(target);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(cfStorageService.guessContentType(target)))
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
            .body(resource);
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
