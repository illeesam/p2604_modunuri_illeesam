package com.shopjoy.ecadminapi.co.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.FileUploadUtil;
import com.shopjoy.ecadminapi.common.util.VideoConvertUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnailator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.common.util.CmUtil;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmUploadService {

    private final FileUploadUtil fileUploadUtil;
    private final VideoConvertUtil videoConvertUtil;
    private final SyAttachService syAttachService;
    private final com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository syPropRepository;
    private final org.springframework.core.env.Environment environment;

    /* yml 기본값은 sy_prop 조회가 실패했을 때만 쓰는 최후 폴백이다.
       실제 값은 sy_prop(app.file.cdn-host) 의 활성 프로파일 행에서 읽는다 — fnCdnHost() 참조. */
    @Value("${app.file.cdn-host:http://localhost:3000/cdn}")
    private String cdnHostFallback;

    /**
     * CDN 호스트 — sy_prop(app.file.cdn-host) 우선, 없으면 yml 폴백.
     *
     * <p>yml 은 이 값을 비워두고 "sy_prop(app.file.*) 에서 주입" 하도록 설계돼 있는데
     * {@code @Value} 는 Spring Environment 만 보므로 sy_prop 값이 반영되지 않았다.
     * 그래서 첨부 URL 이 코드 기본값(구 포트 8080)으로 만들어져 이미지가 깨졌다(2026-07-29 수정).
     * 형제 서비스(CmDeliveryTrackerService.getPropValue)와 같은 방식으로 읽는다.</p>
     */
    private String fnCdnHost() {
        String profile = environment.getActiveProfiles().length > 0
            ? environment.getActiveProfiles()[0] : "-";
        // [쿼리 메서드] 프로퍼티 (환경설정/공통 파라미터) 전체/다건 조회
        String v = syPropRepository.findAll().stream()
            .filter(p -> "Y".equals(p.getUseYn())
                && "app.file.cdn-host".equals(p.getPropKey())
                && fnPropProfileMatch(p.getPropProfile(), profile))
            .map(com.shopjoy.ecadminapi.base.sy.data.entity.SyProp::getPropValue)
            .filter(x -> x != null && !x.isBlank())
            .findFirst().orElse(null);
        return (v != null) ? v : cdnHostFallback;
    }

    /** prop_profile 은 {@code ^local^} 형태의 멀티값. 비어 있거나 all 이면 모든 프로파일에 적용 */
    private boolean fnPropProfileMatch(String propProfile, String activeProfile) {
        if (propProfile == null || propProfile.isBlank() || "all".equals(propProfile)) return true;
        return propProfile.contains("^" + activeProfile + "^");
    }

    /** 단일 파일 업로드 — 확장자/용량 검증, 썸네일 옵션, DB 저장 (그룹/ref 연계 없음) */
    @Transactional
    public Map<String, Object> uploadOne(MultipartFile file, String businessCode,
                                         boolean createThumbnail) {
        fileUploadUtil.validate(file);

        try {
            String folderPath = fileUploadUtil.generateFolderPath(businessCode);
            Files.createDirectories(Paths.get(folderPath));

            String originalName = file.getOriginalFilename();
            String ext = fileUploadUtil.getFileExtension(originalName);
            String savedName = fileUploadUtil.generateFileName(ext, 1);
            String filePath = folderPath + "/" + savedName;

            Files.write(Paths.get(filePath), file.getBytes());

            String finalStoredNm = savedName;
            String thumbFileNm = null;
            String thumbStoredNm = null;
            String thumbUrl = null;
            String thumbGeneratedYn = "N";

            if (fileUploadUtil.isVideo(ext)) {
                fileUploadUtil.validateVideoSize(file.getSize());

                String mp4Name = fileUploadUtil.generateFileName("mp4", 1);
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
                } catch (Exception e) {
                    log.warn("원본 동영상 파일 삭제 실패: {}", e.getMessage());
                }

                finalStoredNm = mp4Name;
                filePath = mp4Path;
            }

            SyAttach syAttach = SyAttach.builder()
                    .fileNm(originalName)
                    .fileSize(file.getSize())
                    .fileExt(fileUploadUtil.isVideo(ext) ? "mp4" : ext)
                    .mimeTypeCd(file.getContentType())
                    .storedNm(finalStoredNm)
                    .storageTypeCd("LOCAL")
                    .storagePath(filePath)
                    .thumbGeneratedYn(thumbGeneratedYn)
                    .sortOrd(1)
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
                    Thumbnailator.createThumbnail(new File(filePath), new File(thumbFilePath), 200, 200);
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

            Map<String, Object> result = new HashMap<>();
            result.put("attachId", savedAttach.getAttachId());
            result.put("originalName", originalName);
            result.put("savedName", savedName);
            result.put("filePath", filePath);
            result.put("fileSize", file.getSize());
            result.put("fileType", file.getContentType());
            result.put("fileExt", ext);
            result.put("uploadedAt", LocalDateTime.now());
            result.put("storageTypeCd", "LOCAL");
            result.put("storagePath", filePath);
            result.put("thumbGeneratedYn", savedAttach.getThumbGeneratedYn());
            if ("Y".equals(savedAttach.getThumbGeneratedYn())) {
                result.put("thumbFileNm", savedAttach.getThumbFileNm());
                result.put("thumbStoredNm", savedAttach.getThumbStoredNm());
                result.put("thumbUrl", savedAttach.getThumbUrl());
            }

            log.info("파일 업로드 성공: {} → {} (attachId: {})", originalName, filePath, savedAttach.getAttachId());
            return result;

        } catch (Exception e) {
            log.error("파일 업로드 실패", e);
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.");
        }
    }

    /**
     * 다중 파일 업로드 — 확장자/용량 검증, 썸네일 옵션, DB 저장.
     * 항상 미연계(ref_table_nm/ref_id NULL) 상태로 업로드한다 — 실제 연계는 대상 레코드를
     * 저장하는 업무 Service 가 {@link SyAttachService#applyChanges} 로 같은 트랜잭션에서 반영한다.
     */
    @Transactional
    public Map<String, Object> uploadMulti(MultipartFile[] files, String businessCode) {
        if (files == null || files.length == 0) throw new CmBizException("업로드할 파일을 선택해주세요." + "::" + CmUtil.svcCallerInfo(this));
        if (files.length > 10) throw new CmBizException("한 번에 최대 10개 파일만 업로드 가능합니다." + "::" + CmUtil.svcCallerInfo(this));

        try {
            List<Map<String, Object>> uploadedFiles = new ArrayList<>();
            List<String> failedFiles = new ArrayList<>();
            List<String> attachIds = new ArrayList<>();
            long totalSize = 0;

            String storageFolderPath = fileUploadUtil.generateStoragePath(businessCode);
            String folderPath = fileUploadUtil.generateFolderPath(businessCode);
            String cdnHost = fnCdnHost();
        String cdnBase = cdnHost.endsWith("/") ? cdnHost.substring(0, cdnHost.length() - 1) : cdnHost;

            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                try {
                    fileUploadUtil.validate(file);
                    Files.createDirectories(Paths.get(folderPath));

                    String originalName = file.getOriginalFilename();
                    String ext = fileUploadUtil.getFileExtension(originalName);
                    String savedName = fileUploadUtil.generateFileName(ext, i + 1);
                    String filePath = folderPath + "/" + savedName;
                    String storageFilePath = storageFolderPath + "/" + savedName;

                    Files.write(Paths.get(filePath), file.getBytes());

                    String finalStoredNm = savedName;
                    String thumbFileNm = null;
                    String thumbStoredNm = null;
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
                                thumbGeneratedYn = "Y";
                                log.info("동영상 썸네일 생성 성공: {}", thumbFileName);
                            }
                        } catch (Exception e) {
                            log.warn("동영상 썸네일 생성 실패: {}", e.getMessage());
                        }

                        try {
                            Files.delete(Paths.get(filePath));
                        } catch (Exception e) {
                            log.warn("원본 동영상 파일 삭제 실패: {}", e.getMessage());
                        }

                        finalStoredNm = mp4Name;
                        filePath = mp4Path;
                        storageFilePath = storageFolderPath + "/" + mp4Name;
                    }

                    String cdnImgUrl = cdnBase + "/" + storageFilePath;

                    SyAttach syAttach = SyAttach.builder()
                            .fileNm(originalName)
                            .fileSize(file.getSize())
                            .fileExt(fileUploadUtil.isVideo(ext) ? "mp4" : ext)
                            .mimeTypeCd(file.getContentType())
                            .storedNm(finalStoredNm)
                            .storageTypeCd("LOCAL")
                            .storagePath(storageFilePath)
                            .physicalPath(filePath)
                            .cdnImgUrl(cdnImgUrl)
                            .thumbGeneratedYn(thumbGeneratedYn)
                            .sortOrd(i + 1)
                            .build();

                    if (thumbFileNm != null) {
                        syAttach.setThumbFileNm(thumbFileNm);
                        syAttach.setThumbStoredNm(thumbStoredNm);
                        syAttach.setThumbUrl(storageFolderPath + "/" + thumbStoredNm);
                    }

                    if (!fileUploadUtil.isVideo(ext) && fileUploadUtil.canGenerateThumbnail(ext)) {
                        try {
                            String thumbFileName = fileUploadUtil.generateThumbFileName(finalStoredNm);
                            String thumbFilePath = folderPath + "/" + thumbFileName;
                            Thumbnailator.createThumbnail(new File(filePath), new File(thumbFilePath), 200, 200);
                            syAttach.setThumbFileNm(originalName + " (thumbnail)");
                            syAttach.setThumbStoredNm(thumbFileName);
                            syAttach.setThumbUrl(storageFolderPath + "/" + thumbFileName);
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
                    fileInfo.put("filePath", storageFilePath);
                    fileInfo.put("fileSize", file.getSize());
                    fileInfo.put("fileType", file.getContentType());
                    fileInfo.put("fileExt", ext);
                    fileInfo.put("uploadedAt", LocalDateTime.now());
                    fileInfo.put("storageTypeCd", "LOCAL");
                    fileInfo.put("storagePath", storageFilePath);
                    fileInfo.put("cdnImgUrl", savedAttach.getCdnImgUrl());
                    fileInfo.put("thumbGeneratedYn", savedAttach.getThumbGeneratedYn());
                    if ("Y".equals(savedAttach.getThumbGeneratedYn())) {
                        fileInfo.put("thumbFileNm", savedAttach.getThumbFileNm());
                        fileInfo.put("thumbStoredNm", savedAttach.getThumbStoredNm());
                        fileInfo.put("thumbUrl", savedAttach.getThumbUrl());
                        String thumbCdnUrl = savedAttach.getThumbUrl() != null
                                ? cdnBase + "/" + savedAttach.getThumbUrl() : null;
                        fileInfo.put("thumbCdnUrl", thumbCdnUrl);
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
            result.put("uploadedCount", uploadedFiles.size());
            result.put("failedCount", failedFiles.size());
            result.put("totalSize", totalSize);
            result.put("attachIds", attachIds);
            result.put("files", uploadedFiles);
            if (!failedFiles.isEmpty()) result.put("failedFiles", failedFiles);

            return result;

        } catch (Exception e) {
            log.error("파일 업로드 실패", e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /** 첨부 파일 단건 조회 (CDN URL 보정 포함) — 그룹/ref 없이 attachId 하나만 직접 참조하는 화면용(예: 프로필 이미지) */
    public SyAttachDto.Item getAttachById(String attachId) {
        SyAttachDto.Item f = syAttachService.getByIdOrNull(attachId);
        if (f == null) return null;
        if (f.getThumbUrl() != null && !f.getThumbUrl().isBlank()) {
            String cdnHost = fnCdnHost();
            String cdnBase = cdnHost.endsWith("/") ? cdnHost.substring(0, cdnHost.length() - 1) : cdnHost;
            f.setThumbCdnUrl(cdnBase + "/" + f.getThumbUrl());
        }
        return f;
    }

    /** 관련 테이블명/ID 로 파일 목록 조회 (CDN URL 보정 포함) */
    public List<SyAttachDto.Item> getRefFiles(String refTableNm, String refId) {
        if (refTableNm == null || refTableNm.isBlank() || refId == null || refId.isBlank())
            throw new CmBizException("refTableNm/refId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        String cdnHost = fnCdnHost();
        String cdnBase = cdnHost.endsWith("/") ? cdnHost.substring(0, cdnHost.length() - 1) : cdnHost;
        SyAttachDto.Request req = new SyAttachDto.Request();
        req.setRefTableNm(refTableNm);
        req.setRefId(refId);
        List<SyAttachDto.Item> files = syAttachService.getList(req);
        files.forEach(f -> {
            if (f.getThumbUrl() != null && !f.getThumbUrl().isBlank()) {
                f.setThumbCdnUrl(cdnBase + "/" + f.getThumbUrl());
            }
        });
        return files;
    }

    /** 첨부 파일 단건 삭제 — DB + 실제 파일. 실제 처리는 SyAttachService.delete() 로 위임(단일 구현) */
    @Transactional
    public void deleteAttach(String attachId) {
        syAttachService.delete(attachId);
    }

    /** 첨부 파일 정렬 순서 변경 */
    @Transactional
    public void updateAttachSort(String attachId, Integer sortOrd) {
        SyAttachDto.Item dto = syAttachService.getById(attachId);
        if (dto == null) throw new CmBizException("존재하지 않는 첨부파일입니다: " + attachId + "::" + CmUtil.svcCallerInfo(this));
        SyAttach entity = SyAttach.builder().attachId(attachId).sortOrd(sortOrd).build();
        syAttachService.updateSelective(entity);
    }

}
