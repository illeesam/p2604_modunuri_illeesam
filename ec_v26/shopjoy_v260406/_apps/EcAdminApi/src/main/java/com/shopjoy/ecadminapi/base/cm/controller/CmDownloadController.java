package com.shopjoy.ecadminapi.base.cm.controller;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/// 파일 다운로드 API
@Slf4j
@RestController
@RequestMapping("/api/cm/download")
public class CmDownloadController {

    /// 파일 다운로드 (경로 기반)
    @GetMapping("/{filePath}")
    public ResponseEntity<?> download(@PathVariable String filePath) {

        try {
            // 보안: 상대 경로만 허용 (../.. 방지)
            if (filePath.contains("..")) {
                throw new CmBizException("잘못된 파일 경로입니다.");
            }

            Path path = Paths.get(filePath);
            File file = path.toFile();

            if (!file.exists()) {
                throw new CmBizException("파일을 찾을 수 없습니다.");
            }

            if (!file.isFile()) {
                throw new CmBizException("파일이 아닙니다.");
            }

            // 파일 읽기
            byte[] fileContent = Files.readAllBytes(path);

            // 파일명 인코딩 (한글 지원)
            String fileName = file.getName();
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);

            // 응답 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentLength(fileContent.length);
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + encodedFileName + "\"");

            log.info("파일 다운로드: {}", fileName);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);

        } catch (IOException e) {
            log.error("파일 다운로드 실패", e);
            throw new RuntimeException("파일 다운로드 중 오류가 발생했습니다.");
        }
    }

    /// 파일 다운로드 (UUID 기반, 보안 강화)
    @GetMapping("/secure/{fileId}")
    public ResponseEntity<?> downloadSecure(@PathVariable String fileId) {

        try {
            // 실제 구현에서는 DB에서 fileId → filePath 조회
            // SELECT file_path FROM sy_attach WHERE attach_id = ?
            // 여기서는 예제만 제공

            throw new CmBizException("해당 파일 정보가 없습니다. DB에서 조회 구현 필요.");

        } catch (Exception e) {
            log.error("파일 다운로드 실패", e);
            throw new RuntimeException("파일 다운로드 중 오류가 발생했습니다.");
        }
    }
}
