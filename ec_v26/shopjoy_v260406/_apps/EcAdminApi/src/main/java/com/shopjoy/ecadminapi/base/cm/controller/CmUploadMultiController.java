package com.shopjoy.ecadminapi.base.cm.controller;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachGrpService;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
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
import java.util.*;

/// 파일 업로드 API (다중 파일 + 썸네일 + DB 저장)
@Slf4j
@RestController
@RequestMapping("/api/cm/upload")
@RequiredArgsConstructor
public class CmUploadMultiController {

    private final FileUploadUtil fileUploadUtil;
    private final SyAttachGrpService syAttachGrpService;
    private final SyAttachService syAttachService;

    /// 다중 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장)
    @PostMapping("/multi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMulti(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "businessCode", defaultValue = "common") String businessCode,
            @RequestParam(value = "grpNm", defaultValue = "") String grpNm,
            @RequestParam(value = "createThumbnail", defaultValue = "false") boolean createThumbnail) {

        if (files == null || files.length == 0) {
            throw new CmBizException("업로드할 파일을 선택해주세요.");
        }

        // 최대 10개 파일 제한
        if (files.length > 10) {
            throw new CmBizException("한 번에 최대 10개 파일만 업로드 가능합니다.");
        }

        try {
            // sy_attach_grp 생성 (파일 그룹)
            SyAttachGrp attachGrp = SyAttachGrp.builder()
                    .attachGrpCode(businessCode + "_" + System.currentTimeMillis())
                    .attachGrpNm(grpNm.isEmpty() ? businessCode + " 파일 그룹" : grpNm)
                    .useYn("Y")
                    .build();
            SyAttachGrp savedGrp = syAttachGrpService.create(attachGrp);

            List<Map<String, Object>> uploadedFiles = new ArrayList<>();
            List<String> failedFiles = new ArrayList<>();
            List<String> attachIds = new ArrayList<>();
            long totalSize = 0;

            // 폴더 경로 생성 (정책: /cdn/businessCode/YYYY/YYYYMM/YYYYMMDD)
            String folderPath = fileUploadUtil.generateFolderPath(businessCode);

            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                try {
                    // 파일 검증 (확장자 + 용량 + 실행파일 차단)
                    fileUploadUtil.validate(file);

                    // 업로드 디렉토리 생성
                    Files.createDirectories(Paths.get(folderPath));

                    // 파일명 생성 (정책: YYYYMMDDhhmmss + random(4) + 순서번호 + 확장자)
                    String originalName = file.getOriginalFilename();
                    String ext = fileUploadUtil.getFileExtension(originalName);
                    String savedName = fileUploadUtil.generateFileName(ext, i + 1);
                    String filePath = folderPath + "/" + savedName;

                    // 파일 저장
                    Files.write(Paths.get(filePath), file.getBytes());

                    // sy_attach 엔티티 생성
                    SyAttach syAttach = SyAttach.builder()
                            .attachGrpId(savedGrp.getAttachGrpId())
                            .fileNm(originalName)
                            .fileSize(file.getSize())
                            .fileExt(ext)
                            .mimeTypeCd(file.getContentType())
                            .storedNm(savedName)
                            .storageType("LOCAL")
                            .storagePath(filePath)
                            .thumbGeneratedYn("N")
                            .sortOrd(i + 1)
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

                    // 응답 데이터에 추가
                    Map<String, Object> fileInfo = new HashMap<>();
                    fileInfo.put("attachId", savedAttach.getAttachId());
                    fileInfo.put("originalName", originalName);
                    fileInfo.put("savedName", savedName);
                    fileInfo.put("filePath", filePath);
                    fileInfo.put("fileSize", file.getSize());
                    fileInfo.put("fileType", file.getContentType());
                    fileInfo.put("fileExt", ext);
                    fileInfo.put("uploadedAt", LocalDateTime.now());
                    fileInfo.put("storageType", "LOCAL");
                    fileInfo.put("storagePath", filePath);
                    fileInfo.put("thumbGeneratedYn", savedAttach.getThumbGeneratedYn());
                    if ("Y".equals(savedAttach.getThumbGeneratedYn())) {
                        fileInfo.put("thumbFileNm", savedAttach.getThumbFileNm());
                        fileInfo.put("thumbStoredNm", savedAttach.getThumbStoredNm());
                        fileInfo.put("thumbUrl", savedAttach.getThumbUrl());
                    }

                    uploadedFiles.add(fileInfo);
                    attachIds.add(savedAttach.getAttachId());
                    totalSize += file.getSize();

                    log.info("파일 업로드 성공: {} → {} (attachId: {})", originalName, filePath, savedAttach.getAttachId());

                } catch (CmBizException e) {
                    failedFiles.add(file.getOriginalFilename() + " - " + e.getMessage());
                    log.warn("파일 검증 실패: {}", file.getOriginalFilename());
                } catch (Exception e) {
                    failedFiles.add(file.getOriginalFilename() + " - 저장 실패");
                    log.error("파일 업로드 실패", e);
                }
            }

            // 응답 데이터
            Map<String, Object> result = new HashMap<>();
            result.put("attachGrpId", savedGrp.getAttachGrpId());
            result.put("uploadedCount", uploadedFiles.size());
            result.put("failedCount", failedFiles.size());
            result.put("totalSize", totalSize);
            result.put("attachIds", attachIds);
            result.put("files", uploadedFiles);
            if (!failedFiles.isEmpty()) {
                result.put("failedFiles", failedFiles);
            }

            return ResponseEntity.status(201).body(ApiResponse.created(result));

        } catch (Exception e) {
            log.error("파일 업로드 실패", e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.");
        }
    }
}
