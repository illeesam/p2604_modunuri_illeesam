package com.shopjoy.eccdnapi.file.service;

import com.shopjoy.eccdnapi.common.config.CfProperties;
import com.shopjoy.eccdnapi.common.exception.CfBizException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

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
}
