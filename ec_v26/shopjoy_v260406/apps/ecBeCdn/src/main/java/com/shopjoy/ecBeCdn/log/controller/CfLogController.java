package com.shopjoy.ecBeCdn.log.controller;

import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import com.shopjoy.ecBeCdn.log.util.CfLogTailUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 로그뷰어 전용 API — /api/cdn/log/** (요청사항: "배포 후 로그화면보는 url", 인증없이 누구나 조회).
 * /api/cdn/** 전체가 이미 SecurityConfig 에서 permitAll 이라 별도 인가 설정 불필요.
 *
 * <p>logback-spring.xml 의 APP_NAME=ecbecdn 규칙과 정확히 맞춰 파일명을 고정한다:
 * {@code {logDir}/ecbecdn.log}(일반), {@code {logDir}/ecbecdn-error.log}(에러 전용).</p>
 */
@RestController
@RequestMapping("/api/cdn/log")
@RequiredArgsConstructor
public class CfLogController {

    private static final String APP_NAME = "ecbecdn";
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Value("${logging.file.path:logs}")
    private String logDir;

    private Path filePath(String fileKey) {
        String fileName = "error".equals(fileKey) ? APP_NAME + "-error.log" : APP_NAME + ".log";
        return Path.of(logDir, fileName);
    }

    /** 로그 파일 목록(일반/에러) — 존재여부·크기·최종수정시각. */
    @GetMapping("/files")
    public ApiResponse<List<Map<String, Object>>> files() {
        List<Map<String, Object>> list = List.of(
            fileInfo("app", "일반 로그"),
            fileInfo("error", "에러 로그")
        );
        return ApiResponse.ok(list);
    }

    private Map<String, Object> fileInfo(String key, String label) {
        Path p = filePath(key);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("label", label);
        m.put("fileName", p.getFileName().toString());
        // 요청사항(2026-09-06): "로그파일 full 경로 표시해줘" — 좌측 tree 의 상위 폴더 라벨과
        // 로그 본문 헤더에 그대로 노출할 절대경로. logDir 이 상대경로("logs")로 설정된 로컬
        // 환경에서도 toAbsolutePath() 로 실제 디스크 위치를 정확히 알려준다.
        m.put("fullPath", p.toAbsolutePath().normalize().toString());
        m.put("exists", java.nio.file.Files.exists(p));
        long size = CfLogTailUtil.sizeOf(p);
        m.put("sizeBytes", size);
        m.put("sizeLabel", fnFmtSize(size));
        long mtime = CfLogTailUtil.lastModifiedOf(p);
        m.put("lastModified", mtime > 0
            ? FMT.format(Instant.ofEpochMilli(mtime).atZone(ZoneId.systemDefault())) : null);
        return m;
    }

    /** 로그 tail — file=app|error(기본 app), lines=최대 2000(기본 200). */
    @GetMapping("/tail")
    public ApiResponse<Map<String, Object>> tail(
            @RequestParam(defaultValue = "app") String file,
            @RequestParam(defaultValue = "200") int lines) {
        Path p = filePath(file);
        List<String> result = CfLogTailUtil.tail(p, lines);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fileKey", file);
        body.put("fileName", p.getFileName().toString());
        body.put("fullPath", p.toAbsolutePath().normalize().toString());
        body.put("exists", java.nio.file.Files.exists(p));
        body.put("requestedLines", lines);
        body.put("returnedLines", result.size());
        body.put("lines", result);
        return ApiResponse.ok(body);
    }

    private String fnFmtSize(long n) {
        if (n < 1024) return n + "B";
        if (n < 1024 * 1024) return String.format("%.1fKB", n / 1024.0);
        return String.format("%.1fMB", n / 1024.0 / 1024.0);
    }
}
