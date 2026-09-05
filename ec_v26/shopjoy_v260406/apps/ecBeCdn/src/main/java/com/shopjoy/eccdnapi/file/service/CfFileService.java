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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
            .regBy(uploaderClientId)
            .regDate(LocalDateTime.now())
            .updBy(uploaderClientId)
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

    /** 관리 화면(CfFileMng.js 카드목록) 목록 — 원본파일명 keyword + 선택적 미디어유형 필터. */
    public PageResult<CfFileDto> getPage(String keyword, String mediaTypeCd, int pageNo, int pageSize) {
        return getPage(keyword, mediaTypeCd, null, pageNo, pageSize);
    }

    /**
     * folder(yyyy-MM-dd) 까지 필터하는 버전 — CfFileFileList.js(좌측 폴더트리) 전용.
     * folder 가 있으면 그 날짜 00:00:00 ~ 다음날 00:00:00 범위로 필터한다(reg_date 기준 —
     * CfStorageService.todayDir() 이 파일을 저장할 때 쓰는 날짜 폴더와 동일 기준).
     */
    public PageResult<CfFileDto> getPage(String keyword, String mediaTypeCd, String folder, int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(Math.max(0, pageNo - 1), pageSize, Sort.by(Sort.Direction.DESC, "regDate"));
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword;
        String mt = (mediaTypeCd == null || mediaTypeCd.isBlank()) ? null : mediaTypeCd;
        LocalDateTime dayStart = null, dayEnd = null;
        if (folder != null && !folder.isBlank()) {
            LocalDate day = LocalDate.parse(folder); // "yyyy-MM-dd"
            dayStart = day.atStartOfDay();
            dayEnd = day.plusDays(1).atStartOfDay();
        }
        Specification<CfFile> spec = fnBuildSpec(kw, mt, dayStart, dayEnd);
        Page<CfFile> page = cfFileRepository.findAll(spec, pageable);
        return new PageResult<>(page.getContent().stream().map(CfFileDto::from).toList(),
            page.getTotalElements(), pageNo, pageSize);
    }

    /**
     * Specification(Criteria API) 로 조건을 조립 — 값이 있는 조건만 프레디케이트를 추가한다.
     * JPQL 하나로 "(:kw IS NULL OR ...)" 패턴을 썼다가 Postgres 에서
     * "operator does not exist: character varying ~~ bytea" 를 만난 적이 있어(2026-09-06,
     * CfFileRepository 상단 주석 참조) 이 방식으로 전환했다 — 조건이 없으면 바인드 파라미터
     * 자체가 안 생기므로 그 타입추론 문제가 원천적으로 없다.
     */
    private Specification<CfFile> fnBuildSpec(String kw, String mt, LocalDateTime dayStart, LocalDateTime dayEnd) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (kw != null) {
                predicates.add(cb.like(root.get("origFileNm"), "%" + kw + "%"));
            }
            if (mt != null) {
                predicates.add(cb.equal(root.get("mediaTypeCd"), mt));
            }
            if (dayStart != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("regDate"), dayStart));
            }
            if (dayEnd != null) {
                predicates.add(cb.lessThan(root.get("regDate"), dayEnd));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    /** 좌측 폴더트리(연도 > 월 > 일) — 실제 파일이 있는 날짜만 노출, 건수 포함. */
    public List<CfFolderNode> getFolderTree() {
        List<Object[]> rows = cfFileRepository.countByDay(); // [{day:"2026-09-04", cnt:3}, ...] DESC
        Map<String, Map<String, List<CfFolderNode>>> tree = new LinkedHashMap<>(); // year -> month -> day nodes

        for (Object[] row : rows) {
            String day = (String) row[0];           // "yyyy-MM-dd"
            long cnt = ((Number) row[1]).longValue();
            String year = day.substring(0, 4);
            String month = day.substring(0, 7);      // "yyyy-MM"
            tree.computeIfAbsent(year, k -> new LinkedHashMap<>())
                .computeIfAbsent(month, k -> new ArrayList<>())
                .add(new CfFolderNode(day, day, cnt, List.of()));
        }

        List<CfFolderNode> years = new ArrayList<>();
        for (var yearEntry : tree.entrySet()) {
            List<CfFolderNode> months = new ArrayList<>();
            long yearCnt = 0;
            for (var monthEntry : yearEntry.getValue().entrySet()) {
                long monthCnt = monthEntry.getValue().stream().mapToLong(CfFolderNode::count).sum();
                months.add(new CfFolderNode(monthEntry.getKey(), monthEntry.getKey(), monthCnt, monthEntry.getValue()));
                yearCnt += monthCnt;
            }
            years.add(new CfFolderNode(yearEntry.getKey(), yearEntry.getKey(), yearCnt, months));
        }
        return years;
    }

    /** 좌측 폴더트리 노드 — id는 folder 쿼리파라미터 값(연/월 노드는 목록 필터에 안 쓰임, 펼침 용도만). */
    public record CfFolderNode(String id, String label, long count, List<CfFolderNode> children) {}

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
