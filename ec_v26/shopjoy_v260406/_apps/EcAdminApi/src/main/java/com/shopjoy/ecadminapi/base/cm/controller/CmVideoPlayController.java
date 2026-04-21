package com.shopjoy.ecadminapi.base.cm.controller;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/// 동영상 스트리밍 재생 API (Range 헤더 지원)
@Slf4j
@RestController
@RequestMapping("/api/cm/video")
public class CmVideoPlayController {

    /// 동영상 스트리밍 재생 (Range 요청 지원)
    /// 클라이언트가 일시정지, 재개, 스크롤 가능
    ///
    /// 파라미터 예제:
    ///   GET /api/cm/video/play/static/cdn/review/2026/202604/20260421/20260421143045012301.mp4
    ///   Range (선택): bytes=0-1023 또는 bytes=1024- 또는 bytes=52428800- (끝부터)
    ///
    /// 응답 예제 1 - 전체 동영상 요청 (Range 헤더 없음, 200 OK):
    ///   HTTP/1.1 200 OK
    ///   Content-Type: video/mp4
    ///   Content-Length: 52428800
    ///   Accept-Ranges: bytes
    ///   Content-Disposition: inline; filename="20260421143045012301.mp4"
    ///   [동영상 바이너리 데이터]
    ///
    /// 응답 예제 2 - 부분 범위 요청 (Range 헤더 있음, 206 Partial Content):
    ///   GET /api/cm/video/play/...
    ///   Range: bytes=0-1023
    ///
    ///   HTTP/1.1 206 Partial Content
    ///   Content-Type: video/mp4
    ///   Content-Length: 1024
    ///   Content-Range: bytes 0-1023/52428800
    ///   Accept-Ranges: bytes
    ///   [동영상 부분 바이너리 데이터 - 1024 바이트]
    ///
    /// 클라이언트 사용 예:
    ///   - HTML5 <video> 태그: 자동으로 Range 요청 지원 (일시정지/재개/스크롤)
    ///   - JavaScript fetch: headers: { Range: "bytes=0-1023" } 로 부분 요청
    ///   - curl: curl -H "Range: bytes=0-1023" http://...
    @Operation(summary = "동영상 스트리밍 재생", description = "HTTP Range 요청을 지원하는 동영상 스트리밍 엔드포인트. 일시정지, 재개, 스크롤이 가능합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "전체 동영상 재생"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "206", description = "부분 범위 동영상 재생"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "동영상 파일을 찾을 수 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/play/{videoPath:.+}")
    public ResponseEntity<?> playVideo(
            @PathVariable String videoPath,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {

        try {
            // 보안: 상대 경로만 허용
            if (videoPath.contains("..")) {
                throw new CmBizException("잘못된 경로입니다.");
            }

            File videoFile = new File(videoPath);

            if (!videoFile.exists()) {
                throw new CmBizException("동영상 파일을 찾을 수 없습니다.");
            }

            if (!videoFile.isFile()) {
                throw new CmBizException("파일이 아닙니다.");
            }

            long fileSize = videoFile.length();

            // Range 헤더 없이 요청 (전체 파일)
            if (rangeHeader == null || rangeHeader.isEmpty()) {
                return streamFullVideo(videoFile, fileSize);
            }

            // Range 헤더 파싱 (예: bytes=0-1023 또는 bytes=1024-)
            return streamVideoRange(videoFile, fileSize, rangeHeader);

        } catch (CmBizException e) {
            log.warn("동영상 재생 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("동영상 재생 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /// 전체 동영상 스트리밍
    private ResponseEntity<?> streamFullVideo(File videoFile, long fileSize) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("video/mp4"));
        headers.setContentLength(fileSize);
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + videoFile.getName() + "\"");

        try (InputStream inputStream = new FileInputStream(videoFile)) {
            byte[] body = inputStream.readAllBytes();
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(body);
        }
    }

    /// 부분 동영상 스트리밍 (Range 요청 처리)
    private ResponseEntity<?> streamVideoRange(File videoFile, long fileSize, String rangeHeader) throws IOException {
        // Range 헤더 파싱
        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long rangeStart = Long.parseLong(ranges[0]);
        long rangeEnd = ranges.length > 1 && !ranges[1].isEmpty()
                ? Long.parseLong(ranges[1])
                : fileSize - 1;

        // 범위 검증
        if (rangeStart < 0 || rangeStart >= fileSize) {
            rangeStart = 0;
        }
        if (rangeEnd >= fileSize) {
            rangeEnd = fileSize - 1;
        }
        if (rangeStart > rangeEnd) {
            rangeEnd = fileSize - 1;
        }

        long contentLength = rangeEnd - rangeStart + 1;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("video/mp4"));
        headers.setContentLength(contentLength);
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.set(HttpHeaders.CONTENT_RANGE, String.format("bytes %d-%d/%d", rangeStart, rangeEnd, fileSize));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + videoFile.getName() + "\"");

        try (InputStream inputStream = new FileInputStream(videoFile)) {
            // 시작 위치로 이동
            inputStream.skip(rangeStart);

            byte[] buffer = new byte[(int) contentLength];
            int bytesRead = inputStream.read(buffer);

            if (bytesRead != contentLength) {
                log.warn("요청한 범위의 모든 바이트를 읽지 못함: {} / {}", bytesRead, contentLength);
            }

            log.info("동영상 스트리밍: {} (bytes {}-{}/{})", videoFile.getName(), rangeStart, rangeEnd, fileSize);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .headers(headers)
                    .body(buffer);
        }
    }

    /// 동영상 정보 조회 (메타데이터)
    ///
    /// 파라미터 예제:
    ///   GET /api/cm/video/info/static/cdn/review/2026/202604/20260421/20260421143045012301.mp4
    ///
    /// 응답 예제 (200 OK):
    ///   {
    ///     "fileName": "20260421143045012301.mp4",
    ///     "fileSize": 52428800,
    ///     "fileSizeMB": "50.00 MB",
    ///     "mimeType": "video/mp4"
    ///   }
    ///
    /// 클라이언트 사용 예:
    ///   - 동영상 재생 전 메타데이터 확인
    ///   - 파일 크기 표시 (다운로드 예상 시간 계산)
    ///   - MIME 타입 검증
    @Operation(summary = "동영상 정보 조회", description = "동영상 파일의 메타데이터(파일명, 크기, MIME 타입)를 조회합니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "동영상 정보 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "동영상 파일을 찾을 수 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @GetMapping("/info/{videoPath:.+}")
    public ResponseEntity<?> getVideoInfo(@PathVariable String videoPath) {
        try {
            // 보안: 상대 경로만 허용
            if (videoPath.contains("..")) {
                throw new CmBizException("잘못된 경로입니다.");
            }

            File videoFile = new File(videoPath);

            if (!videoFile.exists()) {
                throw new CmBizException("동영상 파일을 찾을 수 없습니다.");
            }

            long fileSize = videoFile.length();
            String fileName = videoFile.getName();

            return ResponseEntity.ok()
                    .body(new VideoMetadata(fileName, fileSize, "video/mp4"));

        } catch (Exception e) {
            log.error("동영상 정보 조회 실패", e);
            return ResponseEntity.notFound().build();
        }
    }

    /// 동영상 메타데이터 DTO
    public static class VideoMetadata {
        public String fileName;
        public long fileSize;
        public String mimeType;

        public VideoMetadata(String fileName, long fileSize, String mimeType) {
            this.fileName = fileName;
            this.fileSize = fileSize;
            this.mimeType = mimeType;
        }

        public String getFileName() {
            return fileName;
        }

        public long getFileSize() {
            return fileSize;
        }

        public String getMimeType() {
            return mimeType;
        }

        public String getFileSizeMB() {
            return String.format("%.2f MB", fileSize / (1024.0 * 1024.0));
        }
    }
}
