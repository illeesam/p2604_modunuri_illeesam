package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
@RequestMapping("/api/co/cm/video")
public class CmVideoPlayController {

    /// 동영상 스트리밍 재생 (Range 요청 지원)
    @GetMapping("/play/{videoPath:.+}")
    public ResponseEntity<?> playVideo(
            @PathVariable("videoPath") String videoPath,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {

        try {
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

            if (rangeHeader == null || rangeHeader.isEmpty()) {
                return streamFullVideo(videoFile, fileSize);
            }

            return streamVideoRange(videoFile, fileSize, rangeHeader);

        } catch (CmBizException e) {
            log.warn("동영상 재생 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("동영상 재생 중 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** streamFullVideo */
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

    /** streamVideoRange */
    private ResponseEntity<?> streamVideoRange(File videoFile, long fileSize, String rangeHeader) throws IOException {
        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long rangeStart = Long.parseLong(ranges[0]);
        long rangeEnd = ranges.length > 1 && !ranges[1].isEmpty()
                ? Long.parseLong(ranges[1])
                : fileSize - 1;

        if (rangeStart < 0 || rangeStart >= fileSize) rangeStart = 0;
        if (rangeEnd >= fileSize) rangeEnd = fileSize - 1;
        if (rangeStart > rangeEnd) rangeEnd = fileSize - 1;

        long contentLength = rangeEnd - rangeStart + 1;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.valueOf("video/mp4"));
        headers.setContentLength(contentLength);
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.set(HttpHeaders.CONTENT_RANGE, String.format("bytes %d-%d/%d", rangeStart, rangeEnd, fileSize));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + videoFile.getName() + "\"");

        try (InputStream inputStream = new FileInputStream(videoFile)) {
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
    @GetMapping("/info/{videoPath:.+}")
    public ResponseEntity<?> getVideoInfo(@PathVariable("videoPath") String videoPath) {
        try {
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

    public static class VideoMetadata {
        public String fileName;
        public long fileSize;
        public String mimeType;

        public VideoMetadata(String fileName, long fileSize, String mimeType) {
            this.fileName = fileName;
            this.fileSize = fileSize;
            this.mimeType = mimeType;
        }

        /** getFileName — 조회 */
        public String getFileName() { return fileName; }
        /** getFileSize — 조회 */
        public long getFileSize() { return fileSize; }
        /** getMimeType — 조회 */
        public String getMimeType() { return mimeType; }
        /** getFileSizeMB — 조회 */
        public String getFileSizeMB() { return String.format("%.2f MB", fileSize / (1024.0 * 1024.0)); }
    }
}
