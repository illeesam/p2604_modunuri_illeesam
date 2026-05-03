package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
@RequestMapping("/api/co/cm/image")
public class CmImageViewController {

    /// 이미지 원본 조회 (인라인 표시)
    @GetMapping("/view/{imageUrl:.+}")
    public ResponseEntity<?> viewImage(@PathVariable("imageUrl") String imageUrl) {

        try {
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

            byte[] imageContent = Files.readAllBytes(path);

            String fileName = file.getName();
            String fileExt = getFileExtension(fileName).toLowerCase();

            MediaType mediaType = getImageMediaType(fileExt);
            if (mediaType == null) {
                throw new CmBizException("이미지 파일이 아닙니다.");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setContentLength(imageContent.length);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
            headers.setCacheControl("public, max-age=86400");
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
    @GetMapping("/thumb/{thumbUrl:.+}")
    public ResponseEntity<?> viewThumbnail(@PathVariable("thumbUrl") String thumbUrl) {

        try {
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

            byte[] thumbContent = Files.readAllBytes(path);

            String fileName = file.getName();
            String fileExt = getFileExtension(fileName).toLowerCase();

            MediaType mediaType = getImageMediaType(fileExt);
            if (mediaType == null) {
                throw new CmBizException("이미지 파일이 아닙니다.");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setContentLength(thumbContent.length);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
            headers.setCacheControl("public, max-age=604800");
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

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

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
