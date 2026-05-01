package com.shopjoy.ecadminapi.base.cm.controller;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
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
    private final VideoConvertUtil videoConvertUtil;

    /// 단일 파일 업로드 (확장자/용량 검증, 썸네일 옵션, DB 저장)
    ///
    /// 파라미터 예제:
    ///   POST /api/cm/upload/one
    ///   - file: 업로드할 파일 (필수, 이미지/문서/동영상 등)
    ///   - businessCode: 업무 코드 (기본값: "common", 예: "review", "product")
    ///   - createThumbnail: 이미지 썸네일 생성 여부 (기본값: false, 동영상은 자동 생성)
    ///   - attachGrpId: 파일 그룹 ID (선택, 단독 업로드 시 미사용)
    ///
    /// 응답 예제 (201 Created):
    ///   {
    ///     "success": true,
    ///     "data": {
    ///       "attachId": "ATT20260421143045010101",
    ///       "originalName": "review_video.mp4",
    ///       "savedName": "20260421_143045_01_1234.mp4",
    ///       "filePath": "/cdn/review/2026/202604/20260421/20260421_143045_01_1234.mp4",
    ///       "fileSize": 52428800,
    ///       "fileType": "video/mp4",
    ///       "fileExt": "mp4",
    ///       "uploadedAt": "2026-04-21T14:30:45",
    ///       "storageType": "LOCAL",
    ///       "storagePath": "/cdn/review/2026/202604/20260421/20260421_143045_01_1234.mp4",
    ///       "thumbGeneratedYn": "Y",
    ///       "thumbFileNm": "review_video.mp4 (thumbnail)",
    ///       "thumbStoredNm": "20260421_143045_01_1234_thumb.jpg",
    ///       "thumbUrl": "/cdn/review/2026/202604/20260421/20260421_143045_01_1234_thumb.jpg"
    ///     }
    ///   }
    @Operation(summary = "단일 파일 업로드", description = "이미지, 문서, 동영상 등 단일 파일을 업로드합니다. 동영상은 자동으로 H.264 MP4로 변환되고 썸네일이 생성됩니다.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "파일 업로드 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "파일 검증 실패 (확장자/용량/실행파일)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 오류")
    })
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

            String finalStoredNm = savedName;
            String thumbFileNm = null;
            String thumbStoredNm = null;
            String thumbUrl = null;
            String thumbGeneratedYn = "N";

            // 동영상 처리 (자동 변환 + 필수 썸네일 생성)
            if (fileUploadUtil.isVideo(ext)) {
                fileUploadUtil.validateVideoSize(file.getSize());

                // H.264 MP4로 변환 (스트리밍 최적화)
                String mp4Name = fileUploadUtil.generateFileName("mp4", 1);
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
                    .attachGrpId(attachGrpId != null ? attachGrpId : "")
                    .fileNm(originalName)
                    .fileSize(file.getSize())
                    .fileExt(fileUploadUtil.isVideo(ext) ? "mp4" : ext)
                    .mimeTypeCd(file.getContentType())
                    .storedNm(finalStoredNm)
                    .storageType("LOCAL")
                    .storagePath(filePath)
                    .thumbGeneratedYn(thumbGeneratedYn)
                    .sortOrd(1)
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
