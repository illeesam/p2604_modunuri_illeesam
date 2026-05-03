package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
@RequestMapping("/api/co/cm/download")
public class CmDownloadController {

    /// 파일 다운로드 (경로 기반)
    @Operation(summary = "파일 다운로드 (경로 기반)",
               description = "저장된 파일 경로를 통해 파일을 다운로드합니다. 이미지, 문서, 동영상 등 모든 파일 지원. 한글 파일명 자동 인코딩.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "파일 다운로드 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 파일 경로 또는 파일 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/{filePath}")
    public ResponseEntity<?> download(@PathVariable String filePath) {

        try {
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

            byte[] fileContent = Files.readAllBytes(path);

            String fileName = file.getName();
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);

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
    @Operation(summary = "파일 다운로드 (UUID 기반, 보안)",
               description = "파일 ID를 통해 안전하게 파일을 다운로드합니다. DB 연동으로 사용자 접근 권한 검증. (구현 필요)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "파일 다운로드 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "인증 필요"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "접근 권한 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "파일 정보 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/secure/{fileId}")
    public ResponseEntity<?> downloadSecure(@PathVariable String fileId) {

        try {
            throw new CmBizException("해당 파일 정보가 없습니다. DB에서 조회 구현 필요.");

        } catch (Exception e) {
            log.error("파일 다운로드 실패", e);
            throw new RuntimeException("파일 다운로드 중 오류가 발생했습니다.");
        }
    }
}
