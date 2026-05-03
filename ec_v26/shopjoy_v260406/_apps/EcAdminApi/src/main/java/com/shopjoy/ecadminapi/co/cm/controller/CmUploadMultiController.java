package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachGrpService;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.FileUploadUtil;
import com.shopjoy.ecadminapi.common.util.VideoConvertUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnailator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/// 파일 업로드 API (다중 파일 + 썸네일 + DB 저장)
@Slf4j
@RestController
@RequestMapping("/api/co/cm/upload")
@RequiredArgsConstructor
public class CmUploadMultiController {

    private final FileUploadUtil fileUploadUtil;
    private final SyAttachGrpService syAttachGrpService;
    private final SyAttachService syAttachService;
    private final VideoConvertUtil videoConvertUtil;

    /// 다중 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장)
    @Operation(summary = "다중 파일 업로드", description = "최대 10개의 파일을 한 번에 업로드합니다. 동영상은 자동으로 변환되고 썸네일이 생성됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "파일 업로드 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "파일 검증 실패 또는 최대 개수 초과"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping("/multi")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMulti(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "businessCode", defaultValue = "common") String businessCode,
            @RequestParam(value = "grpNm", defaultValue = "") String grpNm,
            @RequestParam(value = "createThumbnail", defaultValue = "false") boolean createThumbnail) {

        if (files == null || files.length == 0) {
            throw new CmBizException("업로드할 파일을 선택해주세요.");
        }

        if (files.length > 10) {
            throw new CmBizException("한 번에 최대 10개 파일만 업로드 가능합니다.");
        }

        try {
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

            String folderPath = fileUploadUtil.generateFolderPath(businessCode);

            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                try {
                    fileUploadUtil.validate(file);

                    Files.createDirectories(Paths.get(folderPath));

                    String originalName = file.getOriginalFilename();
                    String ext = fileUploadUtil.getFileExtension(originalName);
                    String savedName = fileUploadUtil.generateFileName(ext, i + 1);
                    String filePath = folderPath + "/" + savedName;

                    Files.write(Paths.get(filePath), file.getBytes());

                    String finalStoredNm = savedName;
                    String thumbFileNm = null;
                    String thumbStoredNm = null;
                    String thumbUrl = null;
                    String thumbGeneratedYn = "N";

                    if (fileUploadUtil.isVideo(ext)) {
                        fileUploadUtil.validateVideoSize(file.getSize());

                        String mp4Name = fileUploadUtil.generateFileName("mp4", i + 1);
                        String mp4Path = folderPath + "/" + mp4Name;
                        String convertedPath = videoConvertUtil.convertToStreamableVideo(filePath, mp4Path);

                        try {
                            String thumbFileName = fileUploadUtil.generateThumbFileName(mp4Name);
                            String thumbFilePath = folderPath + "/" + thumbFileName;

                            boolean thumbGenerated = videoConvertUtil.generateVideoThumbnail(convertedPath, thumbFilePath);
                            if (thumbGenerated) {
                                thumbFileNm = originalName + " (thumbnail)";
                                thumbStoredNm = thumbFileName;
                                thumbUrl = thumbFilePath;
                                thumbGeneratedYn = "Y";
                                log.info("동영상 썸네일 생성 성공: {}", thumbFileName);
                            }
                        } catch (Exception e) {
                            log.warn("동영상 썸네일 생성 실패: {}", e.getMessage());
                        }

                        try {
                            Files.delete(Paths.get(filePath));
                            log.info("원본 동영상 파일 삭제: {}", filePath);
                        } catch (Exception e) {
                            log.warn("원본 동영상 파일 삭제 실패: {}", e.getMessage());
                        }

                        finalStoredNm = mp4Name;
                        filePath = mp4Path;
                    }

                    SyAttach syAttach = SyAttach.builder()
                            .attachGrpId(savedGrp.getAttachGrpId())
                            .fileNm(originalName)
                            .fileSize(file.getSize())
                            .fileExt(fileUploadUtil.isVideo(ext) ? "mp4" : ext)
                            .mimeTypeCd(file.getContentType())
                            .storedNm(finalStoredNm)
                            .storageType("LOCAL")
                            .storagePath(filePath)
                            .thumbGeneratedYn(thumbGeneratedYn)
                            .sortOrd(i + 1)
                            .build();

                    if (thumbFileNm != null) {
                        syAttach.setThumbFileNm(thumbFileNm);
                        syAttach.setThumbStoredNm(thumbStoredNm);
                        syAttach.setThumbUrl(thumbUrl);
                    }

                    if (createThumbnail && !fileUploadUtil.isVideo(ext) && fileUploadUtil.canGenerateThumbnail(ext)) {
                        try {
                            String thumbFileName = fileUploadUtil.generateThumbFileName(finalStoredNm);
                            String thumbFilePath = folderPath + "/" + thumbFileName;

                            Thumbnailator.createThumbnail(
                                    new File(filePath),
                                    new File(thumbFilePath),
                                    200, 200);

                            syAttach.setThumbFileNm(originalName + " (thumbnail)");
                            syAttach.setThumbStoredNm(thumbFileName);
                            syAttach.setThumbUrl(thumbFilePath);
                            syAttach.setThumbGeneratedYn("Y");

                            log.info("이미지 썸네일 생성 성공: {}", thumbFileName);
                        } catch (Exception e) {
                            log.warn("이미지 썸네일 생성 실패: {}", e.getMessage());
                        }
                    }

                    SyAttach savedAttach = syAttachService.create(syAttach);

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
                    String errMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    failedFiles.add(file.getOriginalFilename() + " - " + errMsg);
                    log.error("파일 업로드 실패: {}", file.getOriginalFilename(), e);
                }
            }

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
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
