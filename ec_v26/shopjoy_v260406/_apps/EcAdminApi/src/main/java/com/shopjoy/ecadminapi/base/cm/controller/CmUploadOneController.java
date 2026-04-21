package com.shopjoy.ecadminapi.base.cm.controller;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.FileUploadUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnailator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/// 파일 업로드 API (단일 파일 + 썸네일 + DB 저장)
@Slf4j
@RestController
@RequestMapping("/api/cm/upload")
@RequiredArgsConstructor
public class CmUploadOneController {

    private final FileUploadUtil fileUploadUtil;
    private final SyAttachService syAttachService;

    /// 단일 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장)
    @PostMapping("/one")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadOne(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "businessCode", defaultValue = "common") String businessCode,
            @RequestParam(value = "createThumbnail", defaultValue = "false") boolean createThumbnail,
            @RequestParam(value = "attachGrpId", required = false) String attachGrpId) {

        // 파일 검증 (확장자 + 용량 + 실행파일 차단)
        fileUploadUtil.validate(file);

        try {
            // 폴더 경로 생성 (정책: /cdn/businessCode/YYYY/YYYYMM/YYYYMMDD)
            String folderPath = fileUploadUtil.generateFolderPath(businessCode);
            Files.createDirectories(Paths.get(folderPath));

            // 파일명 생성 (정책: YYYYMMDDhhmmss + random(4) + 순서번호 + 확장자)
            String originalName = file.getOriginalFilename();
            String ext = fileUploadUtil.getFileExtension(originalName);
            String savedName = fileUploadUtil.generateFileName(ext, 1);
            String filePath = folderPath + "/" + savedName;

            // 파일 저장
            Files.write(Paths.get(filePath), file.getBytes());

            // sy_attach 엔티티 생성
            SyAttach syAttach = SyAttach.builder()
                    .attachGrpId(attachGrpId != null ? attachGrpId : "")
                    .fileNm(originalName)
                    .fileSize(file.getSize())
                    .fileExt(ext)
                    .mimeTypeCd(file.getContentType())
                    .storedNm(savedName)
                    .storageType("LOCAL")
                    .storagePath(filePath)
                    .thumbGeneratedYn("N")
                    .sortOrd(1)
                    .build();

            // 썸네일 생성
            if (createThumbnail && fileUploadUtil.canGenerateThumbnail(ext)) {
                try {
                    String thumbFileName = fileUploadUtil.generateThumbFileName(savedName);
                    String thumbFilePath = folderPath + "/" + thumbFileName;

                    // 썸네일 생성 (200x200)
                    Thumbnailator.createThumbnail(
                            new File(filePath),
                            new File(thumbFilePath),
                            200, 200);

                    syAttach.setThumbFileNm(originalName + " (thumbnail)");
                    syAttach.setThumbStoredNm(thumbFileName);
                    syAttach.setThumbUrl(thumbFilePath);
                    syAttach.setThumbGeneratedYn("Y");

                    log.info("썸네일 생성 성공: {}", thumbFileName);
                } catch (Exception e) {
                    log.warn("썸네일 생성 실패: {}", e.getMessage());
                }
            }

            // DB 저장
            SyAttach savedAttach = syAttachService.create(syAttach);

            // 응답 데이터
            Map<String, Object> result = new HashMap<>();
            result.put("attachId", savedAttach.getAttachId());
            result.put("originalName", originalName);
            result.put("savedName", savedName);
            result.put("filePath", filePath);
            result.put("fileSize", file.getSize());
            result.put("fileType", file.getContentType());
            result.put("fileExt", ext);
            result.put("uploadedAt", LocalDateTime.now());
            result.put("storageType", "LOCAL");
            result.put("storagePath", filePath);
            result.put("thumbGeneratedYn", syAttach.getThumbGeneratedYn());
            if ("Y".equals(syAttach.getThumbGeneratedYn())) {
                result.put("thumbFileNm", syAttach.getThumbFileNm());
                result.put("thumbStoredNm", syAttach.getThumbStoredNm());
                result.put("thumbUrl", syAttach.getThumbUrl());
            }

            log.info("파일 업로드 성공: {} → {} (attachId: {})", originalName, filePath, savedAttach.getAttachId());
            return ResponseEntity.status(201).body(ApiResponse.created(result));

        } catch (Exception e) {
            log.error("파일 업로드 실패", e);
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.");
        }
    }
}
