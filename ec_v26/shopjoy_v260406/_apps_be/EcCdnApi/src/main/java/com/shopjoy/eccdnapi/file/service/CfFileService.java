package com.shopjoy.eccdnapi.file.service;

import com.shopjoy.eccdnapi.common.config.CfProperties;
import com.shopjoy.eccdnapi.common.exception.CfBizException;
import com.shopjoy.eccdnapi.common.exception.CfFileTooLargeException;
import com.shopjoy.eccdnapi.common.response.PageResult;
import com.shopjoy.eccdnapi.common.util.CfIdUtil;
import com.shopjoy.eccdnapi.file.domain.CfMediaType;
import com.shopjoy.eccdnapi.file.dto.CfFileDto;
import com.shopjoy.eccdnapi.file.entity.CfFile;
import com.shopjoy.eccdnapi.file.repository.CfFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

/**
 * 업로드/삭제/조회 오케스트레이션. 동영상은 항상 첫 프레임+프레임기반 썸네일을 만들고,
 * 이미지는 thumbnailRequested 가 true 일 때만 원본 기반 썸네일을 만든다(요청사항 그대로).
 * 파일명 규칙: 썸네일은 항상 "_thumbnail" 접미사, 동영상 첫 프레임은 "_frame" 접미사.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CfFileService {

    private final CfFileRepository cfFileRepository;
    private final CfStorageService cfStorageService;
    private final CfThumbnailService cfThumbnailService;
    private final CfVideoFrameService cfVideoFrameService;
    private final CfProperties cfProperties;

    @Transactional
    public CfFile upload(MultipartFile file, boolean thumbnailRequested, String uploaderClientId) {
        validateSize(file);

        String origName = file.getOriginalFilename();
        String ext = CfIdUtil.extractExt(origName);
        CfMediaType mediaType = CfMediaType.fromExt(ext);
        String baseName = CfIdUtil.generateStoredBaseName();
        String storedFileName = ext.isEmpty() ? baseName : baseName + "." + ext;

        String filePath = cfStorageService.save(file, storedFileName);
        String thumbnailPath = null;
        String framePath = null;

        if (mediaType == CfMediaType.VIDEO) {
            // 요청사항: 동영상은 첫 프레임 이미지 + 썸네일 이미지 둘 다 — 항상 시도(실패해도 업로드는 유지)
            String frameFileName = baseName + "_frame.jpg";
            String candidateFramePath = cfStorageService.reserveTodayPath(frameFileName);
            boolean frameOk = cfVideoFrameService.extractFirstFrame(
                cfStorageService.resolve(filePath), cfStorageService.resolve(candidateFramePath));
            if (frameOk) {
                framePath = candidateFramePath;
                String thumbFileName = baseName + "_thumbnail.jpg";
                String candidateThumbPath = cfStorageService.reserveTodayPath(thumbFileName);
                try {
                    cfThumbnailService.makeThumbnail(cfStorageService.resolve(framePath), cfStorageService.resolve(candidateThumbPath));
                    thumbnailPath = candidateThumbPath;
                } catch (Exception e) {
                    log.warn("[CfFileService] 동영상 썸네일(프레임 기반) 생성 실패 — 프레임 이미지는 유지: {}", e.getMessage());
                }
            }
        } else if (mediaType == CfMediaType.IMAGE && thumbnailRequested) {
            // 요청사항: 이미지는 썸네일 "요청이 있으면" 파일명에 _thumbnail 붙여서 생성
            String thumbFileName = baseName + "_thumbnail." + ext;
            String candidateThumbPath = cfStorageService.reserveTodayPath(thumbFileName);
            try {
                cfThumbnailService.makeThumbnail(cfStorageService.resolve(filePath), cfStorageService.resolve(candidateThumbPath));
                thumbnailPath = candidateThumbPath;
            } catch (Exception e) {
                log.warn("[CfFileService] 이미지 썸네일 생성 실패 — 원본은 유지: {}", e.getMessage());
            }
        }

        CfFile entity = CfFile.builder()
            .fileId(CfIdUtil.generateFileId())
            .origFileNm(origName)
            .filePath(filePath)
            .thumbnailPath(thumbnailPath)
            .framePath(framePath)
            .fileSize(file.getSize())
            .contentType(file.getContentType())
            .mediaTypeCd(mediaType.name())
            .uploaderClientId(uploaderClientId)
            .useYn("Y")
            .regDate(LocalDateTime.now())
            .updDate(LocalDateTime.now())
            .build();

        CfFile saved = cfFileRepository.save(entity);
        log.info("[CfFileService] 업로드 완료: fileId={} origName={} mediaType={} thumbnail={} frame={}",
            saved.getFileId(), origName, mediaType, thumbnailPath != null, framePath != null);
        return saved;
    }

    @Transactional
    public void delete(String fileId) {
        CfFile entity = getOrThrow(fileId);
        cfStorageService.deleteIfExists(entity.getFilePath());
        cfStorageService.deleteIfExists(entity.getThumbnailPath());
        cfStorageService.deleteIfExists(entity.getFramePath());
        cfFileRepository.delete(entity);
        log.info("[CfFileService] 삭제 완료: fileId={}", fileId);
    }

    /** 관리 화면(static/cf-file.html) 목록 — 원본파일명 keyword + 선택적 미디어유형 필터. */
    public PageResult<CfFileDto> getPage(String keyword, String mediaTypeCd, int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(0, pageNo - 1), pageSize, Sort.by(Sort.Direction.DESC, "regDate"));
        String kw = keyword == null ? "" : keyword;
        Page<CfFile> page = (mediaTypeCd == null || mediaTypeCd.isBlank())
            ? cfFileRepository.findByOrigFileNmContaining(kw, pageable)
            : cfFileRepository.findByOrigFileNmContainingAndMediaTypeCd(kw, mediaTypeCd, pageable);
        return new PageResult<>(page.getContent().stream().map(CfFileDto::from).toList(),
            page.getTotalElements(), pageNo, pageSize);
    }

    public CfFile getOrThrow(String fileId) {
        return cfFileRepository.findById(fileId)
            .orElseThrow(() -> new CfBizException("존재하지 않는 파일입니다: " + fileId));
    }

    private void validateSize(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CfBizException("업로드할 파일이 없습니다.");
        }
        long maxBytes = (long) cfProperties.getMaxFileSizeMb() * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new CfFileTooLargeException(String.format(
                "파일 용량이 허용 크기(%dMB)를 초과했습니다. (요청 파일: %.1fMB)",
                cfProperties.getMaxFileSizeMb(), file.getSize() / 1024.0 / 1024.0));
        }
    }
}
