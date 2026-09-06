package com.shopjoy.ecBeCdn.file.service;

import com.shopjoy.ecBeCdn.common.config.CfProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * 동영상 후처리(변환/첫 프레임 추출) — ffmpeg 를 외부 프로세스로 실행한다(자바 라이브러리 아님,
 * Dockerfile 이 apt-get 으로 설치). 둘 다 실패해도(코덱 미지원 등) 업로드 자체는 계속 진행되도록
 * 예외를 던지지 않고 boolean 으로 성공 여부만 알려준다 — 변환/미리보기 실패로 업로드 전체를
 * 실패시킬 필요는 없다는 판단(원본은 그대로 서빙 가능).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CfVideoFrameService {

    private final CfProperties cfProperties;

    /**
     * 2026-09-06(요청사항: "동영상 업로드도 잘 정리해주고" + "상품리뷰 동영상 업로드가 보다
     * 많이 사용될거야") — 원본을 그대로 저장/서빙하면 아이폰 기본 카메라(.mov, HEVC) 같은
     * 파일이 Chrome/Firefox/Android 브라우저에서 재생 자체가 안 되는 경우가 흔하다(Safari만
     * 예외적으로 재생 가능). EcBeBo 쪽 VideoConvertUtil(storage-type=LOCAL 일 때만 쓰이던
     * 죽은 코드)에 있던 것과 동일한 H.264+AAC+faststart 변환을, 실제로 항상 타는 EcBeCdn
     * 업로드 경로(storage-type=CDN)에 새로 추가한다. 이미 mp4 인 파일도 코덱이 h264/aac가
     * 아닐 수 있어(예: mp4 컨테이너에 다른 코덱) 확장자와 무관하게 항상 변환한다.
     *
     * @return 성공 시 true(destPath 에 변환 결과 존재), 실패 시 false(원본을 그대로 쓰도록 호출부가 폴백)
     */
    public boolean convertToMp4(Path srcPath, Path destPath) {
        List<String> cmd = List.of(
            cfProperties.getFfmpegPath(),
            "-y",
            "-i", srcPath.toString(),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",   // moov atom 을 앞으로 옮겨 다운로드 중에도 재생 시작 가능(점진적 스트리밍)
            destPath.toString()
        );
        try {
            Process process = new ProcessBuilder(cmd).redirectErrorStream(true).start();
            boolean finished = process.waitFor(120, TimeUnit.SECONDS);   // 트랜스코딩은 프레임 추출보다 오래 걸림
            if (!finished) {
                process.destroyForcibly();
                log.warn("[CfVideoFrameService] ffmpeg 변환 타임아웃(120초 초과): {}", srcPath);
                return false;
            }
            if (process.exitValue() != 0 || !Files.exists(destPath)) {
                log.warn("[CfVideoFrameService] 동영상 mp4 변환 실패(exit={}): {}", process.exitValue(), srcPath);
                return false;
            }
            return true;
        } catch (IOException e) {
            log.warn("[CfVideoFrameService] ffmpeg 실행 오류(바이너리 미설치 가능성): {}", e.getMessage());
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[CfVideoFrameService] ffmpeg 변환 대기 중 인터럽트: {}", e.getMessage());
            return false;
        }
    }

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
