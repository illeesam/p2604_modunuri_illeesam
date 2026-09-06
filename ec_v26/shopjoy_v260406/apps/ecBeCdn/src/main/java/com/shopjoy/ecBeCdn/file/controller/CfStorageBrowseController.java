package com.shopjoy.ecBeCdn.file.controller;

import com.shopjoy.ecBeCdn.common.exception.CfBizException;
import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import com.shopjoy.ecBeCdn.common.response.PageResult;
import com.shopjoy.ecBeCdn.file.domain.CfMediaType;
import com.shopjoy.ecBeCdn.file.entity.CfFile;
import com.shopjoy.ecBeCdn.file.repository.CfFileRepository;
import com.shopjoy.ecBeCdn.file.service.CfFileService;
import com.shopjoy.ecBeCdn.file.service.CfStorageService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

/**
 * 실제 디스크 폴더 브라우저 API — /api/cdn/storage/** (요청사항: "좌측 트리정보 2번째 이미지
 * 경로부터 보여야될텐데" / "실제 폴더정보를 트리로 만들어주면 좋겠는데"). CfFileAdminController
 * 의 /api/cdn/file/folders 는 cf_file.reg_date 로 만드는 가상의 연/월/일 트리라, 실제 File
 * Station 에서 보이는 attach/common/CONTACT_CONTENT_ATTACH/prod 같은 레거시 폴더 구조와
 * 전혀 달랐다 — 이 컨트롤러는 storage-root 아래 실제 디렉터리 구조를 그대로 반환한다.
 *
 * <p>permitAll(SecurityConfig, /api/cdn/**) 이라 경로 탈출(../..) 방지가 필수 —
 * 모든 경로 파라미터는 CfStorageService.resolveSafe() 를 거친다.</p>
 */
@RestController
@RequestMapping("/api/cdn/storage")
@RequiredArgsConstructor
public class CfStorageBrowseController {

    private final CfStorageService cfStorageService;
    private final CfFileRepository cfFileRepository;
    private final CfFileService cfFileService;

    /** 좌측 트리 — storage-root 전체를 실제로 훑어서 만든 디렉터리 트리(파일 개수는 하위 전체 누적). */
    @GetMapping("/tree")
    public ApiResponse<List<CfStorageService.RealFolderNode>> tree() {
        return ApiResponse.ok(cfStorageService.buildRealFolderTree());
    }

    /** 선택한 실제 폴더의 직계 파일 목록(하위 폴더 제외) — cf_file 추적 여부와 무관하게 디스크 기준. */
    @GetMapping("/list")
    public ApiResponse<PageResult<RealFileEntry>> list(
            @RequestParam(required = false, defaultValue = "") String folder,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "12") int pageSize) {
        List<Path> all = cfStorageService.listRealFiles(folder);
        int total = all.size();
        int from = Math.min((Math.max(pageNo, 1) - 1) * pageSize, total);
        int to = Math.min(from + pageSize, total);
        List<RealFileEntry> pageItems = all.subList(from, to).stream().map(this::fnToEntry).toList();
        return ApiResponse.ok(new PageResult<>(pageItems, total, pageNo, pageSize));
    }

    /** cf_file 이 추적하지 않는 레거시 파일도 볼 수 있도록 하는 범용 서빙 — path traversal 방지는
     *  resolveSafe() 가 담당. cf_file 추적 파일은 기존 /api/cdn/serve/file/{fileId} 를 그대로 쓴다
     *  (immutable 캐시 등 최적화가 이미 돼있어 중복 구현하지 않음 — 이 엔드포인트는 미추적 파일 전용). */
    @GetMapping("/raw")
    public ResponseEntity<Resource> raw(@RequestParam String path) {
        Path target = cfStorageService.resolveSafe(path);
        if (!Files.exists(target) || !Files.isRegularFile(target)) {
            throw new CfBizException("파일을 찾을 수 없습니다: " + path);
        }
        Resource resource = new FileSystemResource(target);
        String contentType = fnGuessContentType(target);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
            .body(resource);
    }

    /** 파일 삭제 — cf_file 로 추적 중이면 CfFileService.delete() 로 위임(썸네일/프레임/DB 행까지
     *  정리), 미추적 레거시 파일이면 디스크에서만 지운다. */
    @DeleteMapping("/file")
    public ApiResponse<Void> delete(@RequestParam String path) {
        Path target = cfStorageService.resolveSafe(path);
        Optional<CfFile> tracked = cfFileRepository.findByFilePath(path);
        if (tracked.isPresent()) {
            cfFileService.delete(tracked.get().getFileId());
        } else {
            try {
                Files.deleteIfExists(target);
            } catch (IOException e) {
                throw new CfBizException("파일 삭제 실패: " + e.getMessage());
            }
        }
        return ApiResponse.ok(null, "삭제되었습니다.");
    }

    private RealFileEntry fnToEntry(Path file) {
        String relPath = cfStorageService.toRelativePath(file);
        Optional<CfFile> tracked = cfFileRepository.findByFilePath(relPath);
        String name = file.getFileName().toString();
        long size = 0L;
        LocalDateTime lastModified = null;
        try {
            size = Files.size(file);
            lastModified = LocalDateTime.ofInstant(Files.getLastModifiedTime(file).toInstant(), ZoneId.systemDefault());
        } catch (IOException ignored) {
            // 목록 조회 도중 파일이 사라졌거나 권한 문제 — 크기/일시는 비워두고 계속 진행.
        }
        String ext = fnExt(name);

        if (tracked.isPresent()) {
            CfFile f = tracked.get();
            return RealFileEntry.builder()
                .name(name).relPath(relPath).size(size).lastModified(lastModified)
                .mediaTypeCd(f.getMediaTypeCd())
                .tracked(true)
                .fileId(f.getFileId())
                .url("/api/cdn/serve/file/" + f.getFileId())
                .thumbnailUrl(f.getThumbnailPath() != null ? "/api/cdn/serve/thumbnail/" + f.getFileId() : null)
                .build();
        }
        CfMediaType guessed = CfMediaType.fromExt(ext);
        String rawUrl = "/api/cdn/storage/raw?path=" + java.net.URLEncoder.encode(relPath, java.nio.charset.StandardCharsets.UTF_8);
        return RealFileEntry.builder()
            .name(name).relPath(relPath).size(size).lastModified(lastModified)
            .mediaTypeCd(guessed.name())
            .tracked(false)
            .fileId(null)
            .url(rawUrl)
            .thumbnailUrl(guessed == CfMediaType.IMAGE ? rawUrl : null)
            .build();
    }

    private String fnExt(String name) {
        int idx = name.lastIndexOf('.');
        return idx >= 0 ? name.substring(idx + 1) : "";
    }

    private String fnGuessContentType(Path file) {
        try {
            String probed = Files.probeContentType(file);
            if (probed != null) return probed;
        } catch (IOException ignored) {
            // 확장자 기반 폴백으로 진행.
        }
        return switch (CfMediaType.fromExt(fnExt(file.getFileName().toString()))) {
            case IMAGE -> "image/jpeg";
            case VIDEO -> "video/mp4";
            default -> "application/octet-stream";
        };
    }

    /** cf_file 추적 여부와 무관하게 통일된 형태로 내려주는 실제 파일 항목. */
    @Getter
    @Builder
    public static class RealFileEntry {
        private String name;
        private String relPath;
        private Long size;
        private LocalDateTime lastModified;
        private String mediaTypeCd;
        private boolean tracked;   // cf_file 로 관리되는 파일인지(true=관리화면에서도 보임, false=레거시/미추적)
        private String fileId;    // tracked=true 일 때만 값 있음
        private String url;
        private String thumbnailUrl;
    }
}
