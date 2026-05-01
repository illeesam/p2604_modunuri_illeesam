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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/// 이미지 뷰 API (원본 + 썸네일 지원, 인라인 표시)
@Slf4j
@RestController
@RequestMapping("/api/cm/image")
public class CmImageViewController {

    /// 이미지 원본 조회 (인라인 표시)
    ///
    /// 파라미터 예제:
    ///   imageUrl: cdn/review/2026/202604/20260421/20260421_143045_01_1234.jpg
    ///   또는
    ///   imageUrl: cdn/product/2026/202604/20260421/20260421_143045_02_5678.png
    ///
    /// 전체 URL 예제:
    ///   GET /api/cm/image/view/cdn/review/2026/202604/20260421/20260421_143045_01_1234.jpg
    ///
    /// 응답 예제 (200 OK):
    ///   HTTP/1.1 200 OK
    ///   Content-Type: image/jpeg
    ///   Content-Length: 2097152
    ///   Content-Disposition: inline; filename="20260421_143045_01_1234.jpg"
    ///   Cache-Control: public, max-age=86400
    ///   [이미지 바이너리 데이터]
    ///
    /// 클라이언트 사용 예:
    ///   - HTML: <img src="/api/cm/image/view/cdn/review/.../image.jpg">
    ///   - 아바타, 썸네일: <img src="/api/cm/image/view/...">
    ///   - 브라우저 직접 열기: window.open('/api/cm/image/view/...')
    ///
    /// 캐싱:
    ///   - Cache-Control: max-age=86400 (24시간)
    ///   - ETag: 파일 수정일 기반
    ///   - 304 Not Modified 지원
    ///
    /// 보안:
    ///   - 상대 경로만 허용 ("../" 경로 검사로 디렉토리 순회 공격 방지)
    ///   - 파일 존재 및 이미지 MIME 타입 검증
    @Operation(summary = "이미지 원본 조회",
               description = "저장된 이미지 파일을 브라우저에서 직접 표시합니다. 썸네일 없이 원본 이미지를 반환.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "이미지 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "304", description = "이미지 변경 없음 (캐시)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 경로 또는 이미지 아님"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "이미지 파일 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/view/{imageUrl:.+}")
    public ResponseEntity<?> viewImage(@PathVariable String imageUrl) {

        try {
            // 보안: 상대 경로만 허용 (../.. 방지)
            if (imageUrl.contains("..")) {
                throw new CmBizException("잘못된 경로입니다.");
            }

            Path path = Paths.get(imageUrl);
            File file = path.toFile();

            if (!file.exists()) {
                throw new CmBizException("이미지 파일을 찾을 수 없습니다.");
            }

            if (!file.isFile()) {
                throw new CmBizException("파일이 아닙니다.");
            }

            // 파일 읽기
            byte[] imageContent = Files.readAllBytes(path);

            // 파일명
            String fileName = file.getName();
            String fileExt = getFileExtension(fileName).toLowerCase();

            // 이미지 MIME 타입 검증
            MediaType mediaType = getImageMediaType(fileExt);
            if (mediaType == null) {
                throw new CmBizException("이미지 파일이 아닙니다.");
            }

            // 응답 헤더 설정 (인라인 표시)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setContentLength(imageContent.length);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
            headers.setCacheControl("public, max-age=86400");  // 24시간 캐시
            headers.set(HttpHeaders.ETAG, "\"" + file.lastModified() + "\"");

            log.info("이미지 조회: {}", fileName);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(imageContent);

        } catch (IOException e) {
            log.error("이미지 조회 실패", e);
            throw new RuntimeException("이미지 조회 중 오류가 발생했습니다.");
        }
    }

    /// 이미지 썸네일 조회 (인라인 표시)
    ///
    /// 파라미터 예제:
    ///   thumbUrl: cdn/review/2026/202604/20260421/20260421_143045_01_1234_thumb.jpg
    ///   또는
    ///   thumbUrl: cdn/product/2026/202604/20260421/20260421_143045_02_5678_thumb.jpg
    ///
    /// 전체 URL 예제:
    ///   GET /api/cm/image/thumb/cdn/review/2026/202604/20260421/20260421_143045_01_1234_thumb.jpg
    ///
    /// 응답 예제 (200 OK):
    ///   HTTP/1.1 200 OK
    ///   Content-Type: image/jpeg
    ///   Content-Length: 12288 (원본보다 작음)
    ///   Content-Disposition: inline; filename="20260421_143045_01_1234_thumb.jpg"
    ///   Cache-Control: public, max-age=604800
    ///   [썸네일 바이너리 데이터]
    ///
    /// 클라이언트 사용 예:
    ///   - 목록 썸네일: <img src="/api/cm/image/thumb/cdn/review/.../image_thumb.jpg">
    ///   - 리뷰 목록: 각 리뷰 항목에 썸네일 표시
    ///   - 동영상 썸네일: <img src="/api/cm/image/thumb/cdn/review/.../video_thumb.jpg">
    ///
    /// 캐싱:
    ///   - Cache-Control: max-age=604800 (7일)
    ///   - 썸네일은 더 오래 캐시 (거의 변경 안 됨)
    ///
    /// 보안:
    ///   - 상대 경로만 허용 ("../" 경로 검사로 디렉토리 순회 공격 방지)
    ///   - 파일 존재 및 이미지 MIME 타입 검증
    @Operation(summary = "이미지 썸네일 조회",
               description = "저장된 썸네일 파일을 브라우저에서 직접 표시합니다. 목록 조회 시 빠른 로딩을 위해 사용.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "썸네일 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "304", description = "썸네일 변경 없음 (캐시)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "잘못된 경로 또는 이미지 아님"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "썸네일 파일 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/thumb/{thumbUrl:.+}")
    public ResponseEntity<?> viewThumbnail(@PathVariable String thumbUrl) {

        try {
            // 보안: 상대 경로만 허용 (../.. 방지)
            if (thumbUrl.contains("..")) {
                throw new CmBizException("잘못된 경로입니다.");
            }

            Path path = Paths.get(thumbUrl);
            File file = path.toFile();

            if (!file.exists()) {
                throw new CmBizException("썸네일 파일을 찾을 수 없습니다.");
            }

            if (!file.isFile()) {
                throw new CmBizException("파일이 아닙니다.");
            }

            // 파일 읽기
            byte[] thumbContent = Files.readAllBytes(path);

            // 파일명
            String fileName = file.getName();
            String fileExt = getFileExtension(fileName).toLowerCase();

            // 이미지 MIME 타입 검증
            MediaType mediaType = getImageMediaType(fileExt);
            if (mediaType == null) {
                throw new CmBizException("이미지 파일이 아닙니다.");
            }

            // 응답 헤더 설정 (인라인 표시, 더 오래 캐시)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setContentLength(thumbContent.length);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
            headers.setCacheControl("public, max-age=604800");  // 7일 캐시 (썸네일은 거의 변경 안 됨)
            headers.set(HttpHeaders.ETAG, "\"" + file.lastModified() + "\"");

            log.info("썸네일 조회: {}", fileName);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(thumbContent);

        } catch (IOException e) {
            log.error("썸네일 조회 실패", e);
            throw new RuntimeException("썸네일 조회 중 오류가 발생했습니다.");
        }
    }

    /// 파일 확장자 추출
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /// 이미지 MIME 타입 조회
    private MediaType getImageMediaType(String ext) {
        return switch (ext.toLowerCase()) {
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "png" -> MediaType.IMAGE_PNG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.valueOf("image/webp");
            case "svg" -> MediaType.valueOf("image/svg+xml");
            case "bmp" -> MediaType.valueOf("image/bmp");
            default -> null;
        };
    }
}
