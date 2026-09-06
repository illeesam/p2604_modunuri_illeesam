package com.shopjoy.ecBeCdn.file.controller;

import com.shopjoy.ecBeCdn.common.exception.CfBizException;
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
 * 경로 기반 직접 서빙 — /api/cdn/{*path} 캐치올 (요청사항: "경로방식의 접근을 요구하는거야" +
 * "이미지/동영상/썸네일류는 db id 접근방식이 아닌, 리소스경로 접근방식이어야 해").
 *
 * <p>cf_file.file_path/thumbnail_path/frame_path 는 storage-root(app.cf.storage-root=
 * /app/storage/cdn) 기준 상대경로를 그대로 저장한다(예: "attach/prod_img/2026/.../a.png" —
 * "attach" 는 진짜 실제 하위 폴더명이지 이 컨트롤러가 끼워 넣는 접두어가 아니다). 그래서 이
 * 경로값 자체를 URL 뒷부분으로 그대로 노출하면 되고, 이 컨트롤러는 접두어를 하드코딩하지
 * 않는 순수 패스스루다 — CfUploadController/CfFileDto/CfStorageBrowseController 가 URL 을
 * 만들 때 "/api/cdn/" + filePath 로 붙이기만 하면 여기로 정확히 돌아온다.
 *
 * <p>/api/cdn/** 아래 다른 컨트롤러(client/file/storage/upload/serve 등)는 전부 리터럴 경로
 * 세그먼트라 Spring 이 이 캐치올보다 항상 먼저 매치한다(PathPattern 특이성 규칙) — 실제로
 * 없는 하위 경로일 때만 이 컨트롤러가 받는다. 별도 클래스로 둔 이유는 CfFileServeController
 * 처럼 클래스 레벨 프리픽스(/serve 등)가 있으면 캐치올 경로가 그 프리픽스까지 포함해버려서
 * 원하는 최상위 /api/cdn/** 형태가 안 나오기 때문(처음 시도에서 실제로 이 문제로 실패했었다).
 *
 * <p>예) GET /api/cdn/attach/prod_img/2026/202608/20260816/20260816_001537_03_6525.png
 *     → {storage-root}/attach/prod_img/2026/202608/20260816/20260816_001537_03_6525.png
 *
 * <p>동영상 스트리밍(Range 요청, seek)은 이 단순 캐치올로 못 다뤄서 그대로 CfStreamController
 * (/api/cdn/serve/stream/{fileId}, ID 기반 유지)를 쓴다 — 이미지/썸네일/동영상 "원본 파일"
 * 자체 접근만 경로 방식으로 바꾼다.
 *
 * <p>permitAll(SecurityConfig, /api/cdn/** 전체) — path traversal 은 resolveSafe() 가 차단.
 */
@RestController
@RequestMapping("/api/cdn")
@RequiredArgsConstructor
public class CfAttachServeController {

    private final CfStorageService cfStorageService;

    @GetMapping("/{*path}")
    public ResponseEntity<Resource> serve(@PathVariable String path) {
        // path 는 "{*path}" 캐치올 특성상 선행 '/' 를 포함해서 들어온다(예: "/attach/prod_img/...").
        String rel = path.startsWith("/") ? path.substring(1) : path;
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
}
