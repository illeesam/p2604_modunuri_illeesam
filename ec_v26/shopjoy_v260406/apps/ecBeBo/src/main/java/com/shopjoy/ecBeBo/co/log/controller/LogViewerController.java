package com.shopjoy.ecadminapi.co.log.controller;

import com.shopjoy.ecadminapi.co.log.util.LogTailUtil;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 로그뷰어 전용 API — /api/co/log/** (요청사항: "배포 후 로그화면보는 url", 인증없이 누구나 조회).
 * /api/co/** 전체가 이미 SecurityConfig 에서 permitAll 이라 별도 인가 설정 불필요.
 *
 * <p>EcCdnApi 의 {@code com.shopjoy.eccdnapi.log.controller.CfLogController} 구조를 그대로
 * 참고해 이식했다(요청사항: "EcCdnApi 프로그램 참고해줘"). logback-spring.xml 의 APP_NAME=ecadminapi
 * 규칙과 정확히 맞춰 파일명을 고정한다: {@code {logDir}/ecadminapi.log}(일반),
 * {@code {logDir}/ecadminapi-error.log}(에러 전용).</p>
 */
@RestController
@RequestMapping("/api/co/log")
public class LogViewerController {

    private static final String APP_NAME = "ecadminapi";
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Value("${logging.file.path:logs}")
    private String logDir;

    private Path filePath(String fileKey) {
        String fileName = "error".equals(fileKey) ? APP_NAME + "-error.log" : APP_NAME + ".log";
        return Path.of(logDir, fileName);
    }

    /** 로그 파일 목록(일반/에러) — 존재여부·크기·최종수정시각. */
    @GetMapping("/files")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> files() {
        List<Map<String, Object>> list = List.of(
            fileInfo("app", "일반 로그"),
            fileInfo("error", "에러 로그")
        );
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    private Map<String, Object> fileInfo(String key, String label) {
        Path p = filePath(key);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("label", label);
        m.put("fileName", p.getFileName().toString());
        // 요청사항(2026-09-06): "로그파일 full 경로 표시해줘" — 좌측 tree 의 상위 폴더 라벨과
        // 로그 본문 헤더에 그대로 노출할 절대경로.
        m.put("fullPath", p.toAbsolutePath().normalize().toString());
        m.put("exists", Files.exists(p));
        long size = LogTailUtil.sizeOf(p);
        m.put("sizeBytes", size);
        m.put("sizeLabel", fnFmtSize(size));
        long mtime = LogTailUtil.lastModifiedOf(p);
        m.put("lastModified", mtime > 0
            ? FMT.format(Instant.ofEpochMilli(mtime).atZone(ZoneId.systemDefault())) : null);
        return m;
    }

    /** 로그 tail — file=app|error(기본 app), lines=최대 2000(기본 200). */
    @GetMapping("/tail")
    public ResponseEntity<ApiResponse<Map<String, Object>>> tail(
            @RequestParam(defaultValue = "app") String file,
            @RequestParam(defaultValue = "200") int lines) {
        Path p = filePath(file);
        List<String> result = LogTailUtil.tail(p, lines);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fileKey", file);
        body.put("fileName", p.getFileName().toString());
        body.put("fullPath", p.toAbsolutePath().normalize().toString());
        body.put("exists", Files.exists(p));
        body.put("requestedLines", lines);
        body.put("returnedLines", result.size());
        body.put("lines", result);
        return ResponseEntity.ok(ApiResponse.ok(body));
    }

    private String fnFmtSize(long n) {
        if (n < 1024) return n + "B";
        if (n < 1024 * 1024) return String.format("%.1fKB", n / 1024.0);
        return String.format("%.1fMB", n / 1024.0 / 1024.0);
    }
}
