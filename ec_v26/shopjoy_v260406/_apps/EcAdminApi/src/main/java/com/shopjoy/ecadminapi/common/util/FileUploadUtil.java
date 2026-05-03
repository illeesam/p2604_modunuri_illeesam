package com.shopjoy.ecadminapi.common.util;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

/// 파일 업로드 검증 및 경로/파일명 생성 유틸 - 확장자/용량 제한
@Slf4j
@Component
public class FileUploadUtil {

    @Value("${app.file.allowed-extensions:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,mp4,avi,mov,mkv,webm,flv,wmv,m4v}")
    private String allowedExtensionsStr;

    @Value("${app.file.max-file-size:10485760}")
    private long maxFileSize;

    @Value("${app.file.max-image-size:5242880}")
    private long maxImageSize;

    @Value("${app.file.max-document-size:20971520}")
    private long maxDocumentSize;

    @Value("${app.file.max-video-size:104857600}")
    private long maxVideoSize;

    @Value("${app.file.local.physical-root:src/main/resources/static/cdn}")
    private String physicalRoot;

    @Value("${app.file.local.base-path:attach}")
    private String basePath;

    private static final Set<String> IMAGE_EXTENSIONS = new HashSet<>(
            Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"));
    private static final Set<String> DOCUMENT_EXTENSIONS = new HashSet<>(
            Arrays.asList("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"));
    private static final Set<String> VIDEO_EXTENSIONS = new HashSet<>(
            Arrays.asList("mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v"));
    private static final Set<String> BLOCKED_EXTENSIONS = new HashSet<>(
            Arrays.asList("exe", "bat", "cmd", "com", "dll", "sys", "scr", "vbs", "js", "jar", "zip", "rar", "7z", "iso"));

    /// 파일 유효성 검사 (확장자 + 용량)
    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CmBizException("파일을 선택해주세요.");
        }

        // 확장자 검증
        String fileName = file.getOriginalFilename();
        String ext = getFileExtension(fileName).toLowerCase();

        // 실행파일 차단
        if (isBlockedExtension(ext)) {
            throw new CmBizException("실행 파일은 업로드할 수 없습니다: ." + ext);
        }

        if (!isAllowedExtension(ext)) {
            throw new CmBizException("허용되지 않는 파일 형식입니다. 허용: " + allowedExtensionsStr);
        }

        // 용량 검증
        long fileSize = file.getSize();
        validateFileSize(ext, fileSize, fileName);
    }

    /// 파일 크기 검증 (타입별 제한)
    private void validateFileSize(String ext, long fileSize, String fileName) {
        if (isImage(ext)) {
            if (fileSize > maxImageSize) {
                throw new CmBizException(String.format("이미지 파일은 %dMB 이하여야 합니다.", maxImageSize / 1024 / 1024));
            }
        } else if (isDocument(ext)) {
            if (fileSize > maxDocumentSize) {
                throw new CmBizException(String.format("문서 파일은 %dMB 이하여야 합니다.", maxDocumentSize / 1024 / 1024));
            }
        } else {
            if (fileSize > maxFileSize) {
                throw new CmBizException(String.format("파일은 %dMB 이하여야 합니다.", maxFileSize / 1024 / 1024));
            }
        }
    }

    /// 확장자 허용 여부
    public boolean isAllowedExtension(String ext) {
        return getAllowedExtensions().contains(ext.toLowerCase());
    }

    /// 이미지 파일 여부
    public boolean isImage(String ext) {
        return IMAGE_EXTENSIONS.contains(ext.toLowerCase());
    }

    /// 문서 파일 여부
    public boolean isDocument(String ext) {
        return DOCUMENT_EXTENSIONS.contains(ext.toLowerCase());
    }

    /// 파일명에서 확장자 추출
    public String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /// 안전한 파일명 생성 (보안)
    public String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /// 허용된 확장자 목록 조회
    public Set<String> getAllowedExtensions() {
        return new HashSet<>(Arrays.asList(allowedExtensionsStr.toLowerCase().split(",")));
    }

    /// 최대 파일 크기 조회
    public long getMaxFileSize(String ext) {
        if (isImage(ext)) {
            return maxImageSize;
        } else if (isDocument(ext)) {
            return maxDocumentSize;
        }
        return maxFileSize;
    }

    /// 실행파일 차단 확장자 여부
    public boolean isBlockedExtension(String ext) {
        return BLOCKED_EXTENSIONS.contains(ext.toLowerCase());
    }

    /// 논리 경로 세그먼트 생성 (정책: {basePath}/업무명/YYYY/YYYYMM/YYYYMMDD) — DB storage_path 저장용
    public String generateStoragePath(String businessCode) {
        LocalDateTime now = LocalDateTime.now();
        String base = basePath.endsWith("/") ? basePath.substring(0, basePath.length() - 1) : basePath;
        return String.format("%s/%s/%s/%s/%s",
                base,
                businessCode,
                now.format(DateTimeFormatter.ofPattern("yyyy")),
                now.format(DateTimeFormatter.ofPattern("yyyyMM")),
                now.format(DateTimeFormatter.ofPattern("yyyyMMdd")));
    }

    /// 물리 폴더 경로 생성 ({physicalRoot}/{storagePath}) — 실제 파일 저장용
    public String generateFolderPath(String businessCode) {
        String root = physicalRoot.endsWith("/") ? physicalRoot.substring(0, physicalRoot.length() - 1) : physicalRoot;
        return root + "/" + generateStoragePath(businessCode);
    }

    /// DB의 논리 storagePath → 실제 물리 파일 경로 변환
    public String toPhysicalPath(String storagePath) {
        if (storagePath == null) return null;
        String root = physicalRoot.endsWith("/") ? physicalRoot.substring(0, physicalRoot.length() - 1) : physicalRoot;
        String sp = storagePath.startsWith("/") ? storagePath.substring(1) : storagePath;
        return root + "/" + sp;
    }

    /// 파일명 생성 (정책: YYYYMMDD + "_" + hhmmss + "_" + 순서번호 + "_" + random(4) + 확장자)
    public String generateFileName(String ext, int fileSequence) {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HHmmss");

        String date = now.format(dateFormatter);
        String time = now.format(timeFormatter);

        int random = new Random().nextInt(10000);
        String randomStr = String.format("%04d", random);

        String sequence = String.format("%02d", fileSequence);

        return date + "_" + time + "_" + sequence + "_" + randomStr + "." + ext;
    }

    /// 썸네일 파일명 생성 (_thumb 추가)
    public String generateThumbFileName(String fileName) {
        int dotIndex = fileName.lastIndexOf(".");
        if (dotIndex <= 0) {
            return fileName + "_thumb";
        }
        String nameWithoutExt = fileName.substring(0, dotIndex);
        String ext = fileName.substring(dotIndex + 1);
        return nameWithoutExt + "_thumb." + ext;
    }

    /// 섬네일 생성 가능 확장자 여부
    public boolean canGenerateThumbnail(String ext) {
        return IMAGE_EXTENSIONS.contains(ext.toLowerCase());
    }

    /// 동영상 파일 여부
    public boolean isVideo(String ext) {
        return VIDEO_EXTENSIONS.contains(ext.toLowerCase());
    }

    /// 동영상 용량 검증
    public void validateVideoSize(long fileSize) {
        if (fileSize > maxVideoSize) {
            throw new CmBizException(String.format("동영상은 %dMB 이하여야 합니다.", maxVideoSize / 1024 / 1024));
        }
    }

    /// 동영상 썸네일 생성 가능 여부
    public boolean canGenerateVideoThumbnail(String ext) {
        return VIDEO_EXTENSIONS.contains(ext.toLowerCase());
    }
}
