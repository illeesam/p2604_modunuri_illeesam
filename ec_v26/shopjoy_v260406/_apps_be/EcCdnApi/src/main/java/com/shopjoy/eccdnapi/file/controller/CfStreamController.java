package com.shopjoy.eccdnapi.file.controller;

import com.shopjoy.eccdnapi.common.exception.CfBizException;
import com.shopjoy.eccdnapi.file.entity.CfFile;
import com.shopjoy.eccdnapi.file.service.CfFileService;
import com.shopjoy.eccdnapi.file.service.CfStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 동영상 스트리밍(HTTP Range 지원) — "동영상 스트리머 서버(상품 동영상 리뷰)" 요구사항의 핵심.
 * 브라우저 &lt;video&gt; 태그가 재생 위치를 옮길 때(seek) Range 헤더로 부분 요청을 보내는데,
 * 이걸 지원 안 하면 매번 파일 전체를 처음부터 다시 받아야 해서 탐색이 사실상 불가능해진다.
 * permitAll(SecurityConfig) — 브라우저가 직접 요청.
 */
@RestController
@RequestMapping("/cf")
@RequiredArgsConstructor
public class CfStreamController {

    private static final int BUFFER_SIZE = 8192;

    private final CfFileService cfFileService;
    private final CfStorageService cfStorageService;

    @GetMapping("/stream/{fileId}")
    public ResponseEntity<StreamingResponseBody> stream(
            @PathVariable String fileId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) throws Exception {
        CfFile f = cfFileService.getOrThrow(fileId);
        if (!"VIDEO".equals(f.getMediaTypeCd())) {
            throw new CfBizException("동영상 파일이 아닙니다: " + fileId);
        }
        Path path = cfStorageService.resolve(f.getFilePath());
        if (!Files.exists(path)) throw new CfBizException("파일을 찾을 수 없습니다(디스크에 없음): " + f.getFilePath());

        long fileSize = Files.size(path);
        String contentType = (f.getContentType() != null && !f.getContentType().isBlank()) ? f.getContentType() : "video/mp4";

        long start = 0;
        long end = fileSize - 1;
        boolean partial = false;

        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            partial = true;
            String[] parts = rangeHeader.substring(6).split("-", 2);
            try {
                if (!parts[0].isBlank()) start = Long.parseLong(parts[0]);
                if (parts.length > 1 && !parts[1].isBlank()) end = Long.parseLong(parts[1]);
            } catch (NumberFormatException e) {
                start = 0;
                end = fileSize - 1;
            }
            if (end > fileSize - 1) end = fileSize - 1;
            if (start > end) start = 0;
        }

        long contentLength = end - start + 1;
        long rangeStart = start;
        long rangeEnd = end;

        StreamingResponseBody body = out -> {
            try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "r")) {
                raf.seek(rangeStart);
                byte[] buffer = new byte[BUFFER_SIZE];
                long remaining = rangeEnd - rangeStart + 1;
                while (remaining > 0) {
                    int read = raf.read(buffer, 0, (int) Math.min(buffer.length, remaining));
                    if (read == -1) break;
                    out.write(buffer, 0, read);
                    remaining -= read;
                }
            }
        };

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(partial ? 206 : 200)
            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
            .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
            .contentType(MediaType.parseMediaType(contentType));
        if (partial) {
            builder.header(HttpHeaders.CONTENT_RANGE, "bytes " + rangeStart + "-" + rangeEnd + "/" + fileSize);
        }
        return builder.body(body);
    }
}
