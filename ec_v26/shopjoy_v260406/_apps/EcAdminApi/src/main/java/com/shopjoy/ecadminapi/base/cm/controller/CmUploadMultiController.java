package com.shopjoy.ecadminapi.base.cm.controller;

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
@RequestMapping("/api/cm/upload")
@RequiredArgsConstructor
public class CmUploadMultiController {

    private final FileUploadUtil fileUploadUtil;
    private final SyAttachGrpService syAttachGrpService;
    private final SyAttachService syAttachService;
    private final VideoConvertUtil videoConvertUtil;

    /// 다중 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장)
    ///
    /// 파라미터 예제:
    ///   POST /api/cm/upload/multi
    ///   - files: 업로드할 파일 배열 (필수, 최대 10개)
    ///   - businessCode: 업무 코드 (기본값: "common", 예: "review", "product")
    ///   - grpNm: 파일 그룹 이름 (선택, 기본값: "{businessCode} 파일 그룹")
    ///   - createThumbnail: 이미지 썸네일 생성 여부 (기본값: false, 동영상은 자동 생성)
    ///
    /// 응답 예제 (201 Created):
    ///   {
    ///     "success": true,
    ///     "data": {
    ///       "attachGrpId": "ATG20260421143045123456",
    ///       "uploadedCount": 3,
    ///       "failedCount": 0,
    ///       "totalSize": 157286400,
    ///       "attachIds": ["ATT20260421143045010101", "ATT20260421143045010102", "ATT20260421143045010103"],
    ///       "files": [
    ///         {
    ///           "attachId": "ATT20260421143045010101",
    ///           "originalName": "review_photo1.jpg",
    ///           "savedName": "20260421_143045_01_1234.jpg",
    ///           "filePath": "/cdn/review/2026/202604/20260421/20260421_143045_01_1234.jpg",
    ///           "fileSize": 2097152,
    ///           "fileExt": "jpg",
    ///           "storagePath": "/cdn/review/2026/202604/20260421/20260421_143045_01_1234.jpg",
    ///           "thumbGeneratedYn": "Y",
    ///           "thumbStoredNm": "20260421_143045_01_1234_thumb.jpg",
    ///           "thumbUrl": "/cdn/review/2026/202604/20260421/20260421_143045_01_1234_thumb.jpg"
    ///         },
    ///         {
    ///           "attachId": "ATT20260421143045010102",
    ///           "originalName": "review_video1.mp4",
    ///           "savedName": "20260421_143045_02_5678.mp4",
    ///           "filePath": "/cdn/review/2026/202604/20260421/20260421_143045_02_5678.mp4",
    ///           "fileSize": 52428800,
    ///           "fileExt": "mp4",
    ///           "storagePath": "/cdn/review/2026/202604/20260421/20260421_143045_02_5678.mp4",
    ///           "thumbGeneratedYn": "Y",
    ///           "thumbStoredNm": "20260421_143045_02_5678_thumb.jpg",
    ///           "thumbUrl": "/cdn/review/2026/202604/20260421/20260421_143045_02_5678_thumb.jpg"
    ///         }
    ///       ]
    ///     }
    ///   }
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

                    String finalStoredNm = savedName;
                    String thumbFileNm = null;
                    String thumbStoredNm = null;
                    String thumbUrl = null;
                    String thumbGeneratedYn = "N";

                    // 동영상 처리 (자동 변환 + 필수 썸네일 생성)
                    if (fileUploadUtil.isVideo(ext)) {
                        fileUploadUtil.validateVideoSize(file.getSize());

                        // H.264 MP4로 변환 (스트리밍 최적화)
                        String mp4Name = fileUploadUtil.generateFileName("mp4", i + 1);
                        String mp4Path = folderPath + "/" + mp4Name;
                        String convertedPath = videoConvertUtil.convertToStreamableVideo(filePath, mp4Path);

                        // 동영상 썸네일 생성 (필수)
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

                        // 원본 파일 삭제 (변환 완료 후)
                        try {
                            Files.delete(Paths.get(filePath));
                            log.info("원본 동영상 파일 삭제: {}", filePath);
                        } catch (Exception e) {
                            log.warn("원본 동영상 파일 삭제 실패: {}", e.getMessage());
                        }

                        finalStoredNm = mp4Name;
                        filePath = mp4Path;
                    }

                    // sy_attach 엔티티 생성
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

                    // 이미지 썸네일 생성 (선택사항)
                    if (createThumbnail && !fileUploadUtil.isVideo(ext) && fileUploadUtil.canGenerateThumbnail(ext)) {
                        try {
                            String thumbFileName = fileUploadUtil.generateThumbFileName(finalStoredNm);
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

                            log.info("이미지 썸네일 생성 성공: {}", thumbFileName);
                        } catch (Exception e) {
                            log.warn("이미지 썸네일 생성 실패: {}", e.getMessage());
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
                    String errMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                    failedFiles.add(file.getOriginalFilename() + " - " + errMsg);
                    log.error("파일 업로드 실패: {}", file.getOriginalFilename(), e);
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
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
