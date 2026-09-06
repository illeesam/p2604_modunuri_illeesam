package com.shopjoy.ecBeCdn.file.service;

import com.shopjoy.ecBeCdn.common.config.CfProperties;
import com.shopjoy.ecBeCdn.common.exception.CfBizException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 디스크 읽기/쓰기 전담. 모든 CfFile 의 filePath/thumbnailPath/framePath 는 이 서비스가
 * 돌려주는 "storage-root 기준 상대경로"를 그대로 저장한다 — storage-root 자체가
 * 로컬 실행/NAS 배포마다 달라도(application.yml 의 app.cf.storage-root) DB 값은 안 바뀐다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CfStorageService {

    private final CfProperties cfProperties;

    private Path root() {
        return Paths.get(cfProperties.getStorageRoot());
    }

    /** 오늘 날짜(yyyy/MM/dd) 하위 폴더를 실제로 만들고 상대경로를 반환. 하루 폴더 하나에 몰리는 걸 방지. */
    private String todayDir() {
        String rel = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        try {
            Files.createDirectories(root().resolve(rel));
        } catch (IOException e) {
            throw new CfBizException("저장 폴더 생성 실패: " + e.getMessage());
        }
        return rel;
    }

    /** 상대경로 → 실제 디스크 절대경로. */
    public Path resolve(String relativePath) {
        return root().resolve(relativePath);
    }

    /** 업로드된 MultipartFile 을 오늘 날짜 폴더에 fileName 으로 저장하고 상대경로를 반환. */
    public String save(MultipartFile file, String fileName) {
        String rel = todayDir() + "/" + fileName;
        try {
            file.transferTo(resolve(rel));
        } catch (IOException e) {
            throw new CfBizException("파일 저장 실패: " + e.getMessage());
        }
        return rel;
    }

    /** 오늘 날짜 폴더 기준 빈 목적지 경로만 만들어준다(ffmpeg/Thumbnailator 가 직접 파일을 쓸 대상용). */
    public String reserveTodayPath(String fileName) {
        return todayDir() + "/" + fileName;
    }

    public void deleteIfExists(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        try {
            Files.deleteIfExists(resolve(relativePath));
        } catch (IOException e) {
            log.warn("[CfStorageService] 파일 삭제 실패(무시하고 진행): {} — {}", relativePath, e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  실제 디스크 폴더 브라우저 (2026-09-06 신설, 요청사항: "좌측 트리정보 2번째 이미지
    //  경로부터 보여야될텐데" / "실제 폴더정보를 트리로 만들어주면 좋겠는데") — cf_file 의
    //  reg_date 로 만드는 가상 연/월/일 트리(getFolderTree())와 달리, storage-root 아래
    //  실제로 존재하는 디렉터리 구조 그대로(attach/common/CONTACT_CONTENT_ATTACH/prod 같은
    //  레거시 폴더 포함) 반영한다. cf_file 이 추적하지 않는 파일도 그대로 보인다.
    // ═══════════════════════════════════════════════════════════════════════════

    /** relPath("" 허용 = 루트)가 storage-root 밖으로 벗어나지 않는지 검증 후 절대경로로 변환.
     *  permitAll API 라 "../../etc/passwd" 류 경로 탈출을 반드시 막아야 한다. */
    public Path resolveSafe(String relPath) {
        String cleaned = (relPath == null) ? "" : relPath.replace('\\', '/');
        Path candidate = root().resolve(cleaned).normalize();
        Path rootNormalized = root().normalize();
        if (!candidate.startsWith(rootNormalized)) {
            throw new CfBizException("잘못된 경로입니다: " + relPath);
        }
        return candidate;
    }

    /** storage-root 전체를 재귀적으로 훑어 실제 디렉터리 트리를 만든다(파일 개수는 하위 전체 누적).
     *  디렉터리만 노드로 만들고, 파일이 하나도 없는 빈 폴더도 그대로 노출한다(구조 파악 목적). */
    public List<RealFolderNode> buildRealFolderTree() {
        Path r = root();
        if (!Files.isDirectory(r)) return List.of();
        return fnListChildDirs(r).stream()
            .map(dir -> fnBuildNode(dir, r))
            .toList();
    }

    private RealFolderNode fnBuildNode(Path dir, Path root) {
        List<RealFolderNode> children = fnListChildDirs(dir).stream()
            .map(child -> fnBuildNode(child, root))
            .toList();
        long fileCount = fnCountFilesRecursive(dir);
        String relId = root.relativize(dir).toString().replace('\\', '/');
        return new RealFolderNode(relId, dir.getFileName().toString(), fileCount, children);
    }

    private List<Path> fnListChildDirs(Path dir) {
        List<Path> dirs = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, Files::isDirectory)) {
            for (Path p : stream) dirs.add(p);
        } catch (IOException e) {
            log.warn("[CfStorageService] 폴더 목록 조회 실패(무시): {} — {}", dir, e.getMessage());
        }
        dirs.sort(Comparator.comparing(p -> p.getFileName().toString(), String.CASE_INSENSITIVE_ORDER));
        return dirs;
    }

    private long fnCountFilesRecursive(Path dir) {
        try (var walk = Files.walk(dir)) {
            return walk.filter(Files::isRegularFile).count();
        } catch (IOException e) {
            log.warn("[CfStorageService] 파일 개수 집계 실패(무시): {} — {}", dir, e.getMessage());
            return 0L;
        }
    }

    /** 선택한 실제 폴더의 직계 파일만(하위 폴더 제외) 이름순으로 반환 — 페이징은 호출측에서 슬라이스. */
    public List<Path> listRealFiles(String relFolder) {
        Path dir = resolveSafe(relFolder);
        if (!Files.isDirectory(dir)) return List.of();
        List<Path> files = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, Files::isRegularFile)) {
            for (Path p : stream) files.add(p);
        } catch (IOException e) {
            log.warn("[CfStorageService] 파일 목록 조회 실패(무시): {} — {}", dir, e.getMessage());
        }
        files.sort(Comparator.comparing((Path p) -> p.getFileName().toString(), String.CASE_INSENSITIVE_ORDER).reversed());
        return files;
    }

    /** storage-root 기준 상대경로 문자열로 변환(응답 DTO/파일매칭용). */
    public String toRelativePath(Path absolute) {
        return root().relativize(absolute).toString().replace('\\', '/');
    }

    /** 좌측 실제 폴더트리 노드 — id 는 storage-root 기준 상대경로(그대로 list API 의 folder 파라미터로 사용). */
    public record RealFolderNode(String id, String label, long count, List<RealFolderNode> children) {}
}
