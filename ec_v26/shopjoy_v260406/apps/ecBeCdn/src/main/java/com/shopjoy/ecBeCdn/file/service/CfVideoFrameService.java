package com.shopjoy.eccdnapi.file.service;

import com.shopjoy.eccdnapi.common.config.CfProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * 동영상 첫 프레임(미리보기 이미지) 추출 — ffmpeg 를 외부 프로세스로 실행한다(자바 라이브러리 아님,
 * Dockerfile 이 apt-get 으로 설치). 실패해도(코덱 미지원 등) 업로드 자체는 계속 진행되도록
 * 예외를 던지지 않고 boolean 으로 성공 여부만 알려준다 — 미리보기 이미지 하나 없다고 업로드
 * 전체를 실패시킬 필요는 없다는 판단.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CfVideoFrameService {

    private final CfProperties cfProperties;

    /** 동영상 1초 지점 프레임을 destPath(jpg)로 추출. 성공하면 true. */
    public boolean extractFirstFrame(Path videoPath, Path destPath) {
        List<String> cmd = List.of(
            cfProperties.getFfmpegPath(),
            "-y",                       // 목적지 파일 있으면 덮어쓰기
            "-ss", "00:00:01",          // 1초 지점(0초는 검은 화면/페이드인인 경우가 많아 살짝 뒤로)
            "-i", videoPath.toString(),
            "-vframes", "1",
            "-q:v", "2",                // JPEG 품질(2=고품질, 낮을수록 좋음)
            destPath.toString()
        );
        try {
            Process process = new ProcessBuilder(cmd).redirectErrorStream(true).start();
            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("[CfVideoFrameService] ffmpeg 타임아웃(30초 초과): {}", videoPath);
                return false;
            }
            if (process.exitValue() != 0 || !Files.exists(destPath)) {
                log.warn("[CfVideoFrameService] ffmpeg 첫 프레임 추출 실패(exit={}): {}", process.exitValue(), videoPath);
                return false;
            }
            return true;
        } catch (IOException e) {
            log.warn("[CfVideoFrameService] ffmpeg 실행 오류(바이너리 미설치 가능성): {}", e.getMessage());
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[CfVideoFrameService] ffmpeg 대기 중 인터럽트: {}", e.getMessage());
            return false;
        }
    }
}
