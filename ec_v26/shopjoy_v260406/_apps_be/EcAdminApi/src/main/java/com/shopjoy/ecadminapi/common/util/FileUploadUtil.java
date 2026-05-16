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

/**
 * 파일 업로드 검증 및 경로/파일명 생성 유틸.
 *
 * <p>역할/책임:
 * <ul>
 *   <li>업로드 파일의 확장자 화이트리스트/블랙리스트 검증</li>
 *   <li>파일 타입(이미지/문서/동영상)별 용량 제한 검증</li>
 *   <li>DB 저장용 논리 경로(storagePath) 및 실제 물리 경로 생성</li>
 *   <li>충돌 없는 저장 파일명 / 썸네일 파일명 생성</li>
 * </ul>
 *
 * <p>언제 쓰이는지: 첨부파일 업로드 처리 Service 에서 파일 저장 직전 검증·경로/파일명 결정에 사용.
 *
 * <p>주의사항:
 * <ul>
 *   <li>{@code @Component} 싱글톤 빈. {@code @Value} 설정값(application.yml)에 의존하므로 정적 호출 불가.</li>
 *   <li>{@link #validate(MultipartFile)}는 검증 실패 시 {@link CmBizException}(400)을 던진다.</li>
 *   <li>실행 파일(exe/bat/jar 등)은 화이트리스트와 무관하게 항상 차단된다.</li>
 * </ul>
 */
@Slf4j
@Component
public class FileUploadUtil {

    /** 업로드 허용 확장자 목록(콤마 구분). application.yml app.file.allowed-extensions 로 오버라이드. */
    @Value("${app.file.allowed-extensions:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,mp4,avi,mov,mkv,webm,flv,wmv,m4v}")
    private String allowedExtensionsStr;

    /** 일반 파일 최대 크기(byte). 기본 10MB(10485760). */
    @Value("${app.file.max-file-size:10485760}")
    private long maxFileSize;

    /** 이미지 파일 최대 크기(byte). 기본 5MB(5242880). */
    @Value("${app.file.max-image-size:5242880}")
    private long maxImageSize;

    /** 문서 파일 최대 크기(byte). 기본 20MB(20971520). */
    @Value("${app.file.max-document-size:20971520}")
    private long maxDocumentSize;

    /** 동영상 파일 최대 크기(byte). 기본 100MB(104857600). */
    @Value("${app.file.max-video-size:104857600}")
    private long maxVideoSize;

    /** 실제 파일이 저장되는 물리 루트 디렉터리. storagePath 앞에 붙는다. */
    @Value("${app.file.local.physical-root:src/main/resources/static/cdn}")
    private String physicalRoot;

    /** DB storagePath 의 최상위 논리 세그먼트(예: "attach"). */
    @Value("${app.file.local.base-path:attach}")
    private String basePath;

    /** 이미지로 간주하는 확장자(썸네일 생성 가능). 소문자 비교 전제. */
    private static final Set<String> IMAGE_EXTENSIONS = new HashSet<>(
            Arrays.asList("jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"));
    /** 문서로 간주하는 확장자(문서 용량 제한 적용). */
    private static final Set<String> DOCUMENT_EXTENSIONS = new HashSet<>(
            Arrays.asList("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"));
    /** 동영상으로 간주하는 확장자(동영상 용량 제한·썸네일 추출 대상). */
    private static final Set<String> VIDEO_EXTENSIONS = new HashSet<>(
            Arrays.asList("mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v"));
    /**
     * 화이트리스트와 무관하게 항상 차단하는 실행/위험 확장자.
     * zip/rar 등 압축도 포함 — 우회 실행 위험 때문에 명시적으로 거부한다.
     */
    private static final Set<String> BLOCKED_EXTENSIONS = new HashSet<>(
            Arrays.asList("exe", "bat", "cmd", "com", "dll", "sys", "scr", "vbs", "js", "jar", "zip", "rar", "7z", "iso"));

    /**
     * 파일 유효성 검사 (확장자 + 용량).
     *
     * <p>차단 확장자 → 비허용 확장자 → 타입별 용량 순으로 검증한다.
     *
     * @param file 업로드된 MultipartFile (null·empty 면 즉시 예외)
     * @throws CmBizException 파일 미선택/실행파일/비허용 확장자/용량 초과인 경우 (모두 400 비즈니스 예외)
     */
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

    /**
     * 파일 크기 검증 (타입별 제한).
     *
     * <p>이미지면 maxImageSize, 문서면 maxDocumentSize, 그 외(동영상 포함)는 maxFileSize 기준으로 비교한다.
     * 동영상 전용 한도는 별도 {@link #validateVideoSize(long)} 로 처리하므로 여기서는 일반 한도가 적용됨에 주의.
     *
     * @param ext      소문자 확장자
     * @param fileSize 파일 크기(byte)
     * @param fileName 원본 파일명 (현재 메시지에는 미사용, 시그니처 유지)
     * @throws CmBizException 해당 타입 한도를 초과한 경우
     */
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

    /**
     * 확장자 허용 여부.
     *
     * @param ext 확장자(대소문자 무관, 내부에서 소문자 변환)
     * @return 허용 목록(allowedExtensionsStr)에 포함되면 true
     */
    public boolean isAllowedExtension(String ext) {
        return getAllowedExtensions().contains(ext.toLowerCase());
    }

    /**
     * 이미지 파일 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return jpg/jpeg/png/gif/webp/bmp/svg 중 하나면 true
     */
    public boolean isImage(String ext) {
        return IMAGE_EXTENSIONS.contains(ext.toLowerCase());
    }

    /**
     * 문서 파일 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return pdf/doc/docx/xls/xlsx/ppt/pptx/txt/csv 중 하나면 true
     */
    public boolean isDocument(String ext) {
        return DOCUMENT_EXTENSIONS.contains(ext.toLowerCase());
    }

    /**
     * 파일명에서 확장자 추출.
     *
     * <p>마지막 '.' 이후 문자열을 그대로 반환(소문자 변환 안 함).
     *
     * @param fileName 원본 파일명
     * @return 확장자. fileName 이 null 이거나 '.' 가 없으면 빈 문자열
     */
    public String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /**
     * 안전한 파일명 생성 (보안).
     *
     * <p>경로 조작·특수문자 공격 방지를 위해 영숫자/{@code . _ -} 외 모든 문자를 {@code _} 로 치환한다.
     *
     * @param fileName 원본 파일명 (null 이면 NPE 가능 — 호출 전 null 보장 필요)
     * @return 안전하게 치환된 파일명
     */
    public String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * 허용된 확장자 목록 조회.
     *
     * @return 설정값을 콤마 분리해 소문자로 만든 Set (호출 시마다 새 Set 생성)
     */
    public Set<String> getAllowedExtensions() {
        return new HashSet<>(Arrays.asList(allowedExtensionsStr.toLowerCase().split(",")));
    }

    /**
     * 확장자 타입에 따른 최대 파일 크기 조회.
     *
     * @param ext 확장자(대소문자 무관)
     * @return 이미지면 maxImageSize, 문서면 maxDocumentSize, 그 외는 maxFileSize (byte)
     */
    public long getMaxFileSize(String ext) {
        if (isImage(ext)) {
            return maxImageSize;
        } else if (isDocument(ext)) {
            return maxDocumentSize;
        }
        return maxFileSize;
    }

    /**
     * 실행파일 차단 확장자 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return BLOCKED_EXTENSIONS(exe/bat/jar/zip 등)에 포함되면 true
     */
    public boolean isBlockedExtension(String ext) {
        return BLOCKED_EXTENSIONS.contains(ext.toLowerCase());
    }

    /**
     * 논리 경로 세그먼트 생성 — DB storage_path 저장용.
     *
     * <p>정책: {@code {basePath}/업무코드/YYYY/YYYYMM/YYYYMMDD}. 날짜는 호출 시각 기준.
     * basePath 끝의 '/' 는 제거 후 조합한다(이중 슬래시 방지).
     *
     * @param businessCode 업무 분류 코드(경로 두 번째 세그먼트)
     * @return DB 에 저장할 논리 경로 문자열
     */
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

    /**
     * 물리 폴더 경로 생성 — 실제 파일 저장 디렉터리.
     *
     * <p>형식: {@code {physicalRoot}/{storagePath}}. physicalRoot 끝 '/' 제거 후 조합.
     *
     * @param businessCode 업무 분류 코드
     * @return 실제 파일을 기록할 물리 폴더 경로
     */
    public String generateFolderPath(String businessCode) {
        String root = physicalRoot.endsWith("/") ? physicalRoot.substring(0, physicalRoot.length() - 1) : physicalRoot;
        return root + "/" + generateStoragePath(businessCode);
    }

    /**
     * DB의 논리 storagePath → 실제 물리 파일 경로 변환.
     *
     * <p>DB에 저장된 storagePath 앞에 physicalRoot 를 붙여 다운로드/삭제 시 실제 경로로 환원한다.
     * storagePath 선두 '/' 는 제거해 이중 슬래시를 방지한다.
     *
     * @param storagePath DB 의 논리 경로 (null 이면 null 반환)
     * @return 실제 물리 경로. storagePath 가 null 이면 null
     */
    public String toPhysicalPath(String storagePath) {
        if (storagePath == null) return null;
        String root = physicalRoot.endsWith("/") ? physicalRoot.substring(0, physicalRoot.length() - 1) : physicalRoot;
        String sp = storagePath.startsWith("/") ? storagePath.substring(1) : storagePath;
        return root + "/" + sp;
    }

    /**
     * 저장 파일명 생성.
     *
     * <p>정책: {@code YYYYMMDD_HHmmss_순서(2자리)_random(4자리).확장자}.
     * 동일 초에 여러 파일이 올라와도 fileSequence + random 4자리로 충돌 가능성을 낮춘다.
     *
     * @param ext          확장자(점 없이, 예: "jpg")
     * @param fileSequence 동일 업로드 묶음 내 순서번호 (2자리로 zero-pad)
     * @return 생성된 파일명
     */
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

    /**
     * 썸네일 파일명 생성 (확장자 앞에 {@code _thumb} 삽입).
     *
     * <p>예: {@code abc.jpg} → {@code abc_thumb.jpg}.
     * '.' 가 없거나 선두에 있는 경우(dotIndex &lt;= 0)는 확장자 없이 {@code 파일명_thumb} 반환.
     *
     * @param fileName 원본 저장 파일명
     * @return 썸네일용 파일명
     */
    public String generateThumbFileName(String fileName) {
        int dotIndex = fileName.lastIndexOf(".");
        if (dotIndex <= 0) {
            return fileName + "_thumb";
        }
        String nameWithoutExt = fileName.substring(0, dotIndex);
        String ext = fileName.substring(dotIndex + 1);
        return nameWithoutExt + "_thumb." + ext;
    }

    /**
     * 이미지 썸네일 생성 가능 확장자 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return 이미지 확장자면 true
     */
    public boolean canGenerateThumbnail(String ext) {
        return IMAGE_EXTENSIONS.contains(ext.toLowerCase());
    }

    /**
     * 동영상 파일 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return mp4/avi/mov/mkv/webm/flv/wmv/m4v 중 하나면 true
     */
    public boolean isVideo(String ext) {
        return VIDEO_EXTENSIONS.contains(ext.toLowerCase());
    }

    /**
     * 동영상 용량 검증.
     *
     * <p>일반 {@link #validateFileSize}와 별개로 동영상 전용 한도(maxVideoSize)를 적용한다.
     *
     * @param fileSize 파일 크기(byte)
     * @throws CmBizException maxVideoSize 초과 시
     */
    public void validateVideoSize(long fileSize) {
        if (fileSize > maxVideoSize) {
            throw new CmBizException(String.format("동영상은 %dMB 이하여야 합니다.", maxVideoSize / 1024 / 1024));
        }
    }

    /**
     * 동영상 썸네일 생성 가능 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return 동영상 확장자면 true (실제 추출은 FFmpeg 설치 여부에 의존)
     */
    public boolean canGenerateVideoThumbnail(String ext) {
        return VIDEO_EXTENSIONS.contains(ext.toLowerCase());
    }
}
