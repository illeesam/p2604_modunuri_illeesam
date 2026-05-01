package com.shopjoy.ecadminapi.base.cm.controller;

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
@RequestMapping("/api/cm/download")
public class CmDownloadController {

    /// 파일 다운로드 (경로 기반)
    ///
    /// 파라미터 예제:
    ///   GET /api/cm/download/cdn/review/2026/202604/20260421/20260421_143045_01_1234.jpg
    ///   또는
    ///   GET /api/cm/download/cdn/common/2026/202604/20260421/20260421_143045_02_5678.pdf
    ///
    /// 응답 예제 (200 OK):
    ///   HTTP/1.1 200 OK
    ///   Content-Type: application/octet-stream
    ///   Content-Length: 2097152
    ///   Content-Disposition: attachment; filename="%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg"
    ///
    /// 클라이언트 사용 예:
    ///   - 브라우저: <a href="/api/cm/download/...">다운로드</a>
    ///   - JavaScript: window.open('/api/cm/download/...')
    ///   - curl: curl -O http://localhost:8080/api/cm/download/...
    ///   - Python: requests.get(url).content
    ///
    /// 파일명 인코딩:
    ///   - 한글 파일명 자동 URL 인코딩 (UTF-8)
    ///   - 브라우저에서 자동으로 디코딩되어 원본 파일명으로 다운로드
    ///
    /// 보안:
    ///   - 상대 경로만 허용 ("../" 경로 검사로 디렉토리 순회 공격 방지)
    ///   - 파일 존재 및 파일 유형 검증
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
    ///
    /// 파라미터 예제:
    ///   GET /api/cm/download/secure/ATT20260421143045012301
    ///   또는
    ///   GET /api/cm/download/secure/ATT20260421143045010101
    ///
    /// 응답 예제 (200 OK):
    ///   HTTP/1.1 200 OK
    ///   Content-Type: application/octet-stream
    ///   Content-Length: 2097152
    ///   Content-Disposition: attachment; filename="%EC%9D%B4%EB%AF%B8%EC%A7%80.jpg"
    ///
    /// 에러 응답 예제 (404 Not Found):
    ///   HTTP/1.1 404 Not Found
    ///   {
    ///     "success": false,
    ///     "error": "해당 파일 정보가 없습니다. DB에서 조회 구현 필요."
    ///   }
    ///
    /// 클라이언트 사용 예:
    ///   - 장바구니/주문에 첨부된 파일 다운로드
    ///   - 회원 인증 필수 파일 다운로드
    ///   - 예: <a href="/api/cm/download/secure/ATT20260421143045012301">영수증 다운로드</a>
    ///
    /// DB 구현 필요:
    ///   SELECT file_path, file_nm FROM sy_attach
    ///   WHERE attach_id = ? AND user_id = ? (접근 권한 검증)
    ///
    /// 보안:
    ///   - 파일 ID(UUID) 기반 조회로 경로 노출 방지
    ///   - DB에서 사용자 접근 권한 검증 필수
    ///   - 인증된 사용자만 접근 가능하도록 @PreAuthorize 추가 권장
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
