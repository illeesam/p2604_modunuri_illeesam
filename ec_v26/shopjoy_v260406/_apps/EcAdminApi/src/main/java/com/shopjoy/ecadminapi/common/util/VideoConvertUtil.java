package com.shopjoy.ecadminapi.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/// 동영상 처리 유틸 - 포맷 변환, 썸네일 생성
@Slf4j
@Component
public class VideoConvertUtil {

    private static final Set<String> SUPPORTED_VIDEO_FORMATS = new HashSet<>(
            Arrays.asList("mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v"));

    /// 동영상 파일 지원 여부
    public boolean isSupportedVideo(String ext) {
        return SUPPORTED_VIDEO_FORMATS.contains(ext.toLowerCase());
    }

    /// 동영상 썸네일 생성 여부 (FFmpeg 필요)
    public boolean canGenerateVideoThumbnail(String ext) {
        return isSupportedVideo(ext);
    }

    /// 동영상 파일 여부
    public boolean isVideoFile(String ext) {
        return isSupportedVideo(ext);
    }

    /// 동영상을 H.264 MP4로 변환 (스트리밍 최적화)
    /// 참고: 실제 구현은 FFmpeg 설치 필요
    public String convertToStreamableVideo(String inputPath, String outputPath) {
        try {
            // FFmpeg 설치 확인
            if (!isFFmpegAvailable()) {
                log.warn("FFmpeg not installed. Skipping video conversion.");
                return inputPath; // 원본 반환
            }

            // H.264 코덱, AAC 오디오로 변환 (스트리밍 최적화)
            String command = String.format(
                    "ffmpeg -i \"%s\" -c:v libx264 -preset fast -crf 23 " +
                    "-c:a aac -b:a 128k -movflags +faststart \"%s\" -y",
                    inputPath, outputPath);

            Process process = Runtime.getRuntime().exec(command);
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                log.info("동영상 변환 성공: {} → {}", inputPath, outputPath);
                return outputPath;
            } else {
                log.error("동영상 변환 실패 (exitCode: {})", exitCode);
                return inputPath;
            }

        } catch (Exception e) {
            log.error("동영상 변환 중 오류", e);
            return inputPath;
        }
    }

    /// 동영상 썸네일 생성 (첫 프레임)
    public boolean generateVideoThumbnail(String videoPath, String thumbPath) {
        try {
            if (!isFFmpegAvailable()) {
                log.warn("FFmpeg not installed. Skipping thumbnail generation.");
                return false;
            }

            // 첫 프레임을 PNG로 추출 (1초 위치)
            String command = String.format(
                    "ffmpeg -i \"%s\" -ss 00:00:01 -vf scale=200:200 -vframes 1 \"%s\" -y",
                    videoPath, thumbPath);

            Process process = Runtime.getRuntime().exec(command);
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                log.info("동영상 썸네일 생성 성공: {}", thumbPath);
                return true;
            } else {
                log.error("동영상 썸네일 생성 실패 (exitCode: {})", exitCode);
                return false;
            }

        } catch (Exception e) {
            log.error("동영상 썸네일 생성 중 오류", e);
            return false;
        }
    }

    /// 동영상 정보 조회 (길이, 비트레이트 등)
    public VideoInfo getVideoInfo(String videoPath) {
        try {
            if (!isFFmpegAvailable()) {
                return null;
            }

            // FFprobe로 메타데이터 추출 (간단한 구현)
            String command = String.format(
                    "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:csv=p=0 \"%s\"",
                    videoPath);

            Process process = Runtime.getRuntime().exec(command);
            java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(process.getInputStream()));
            String duration = reader.readLine();

            if (duration != null && !duration.isEmpty()) {
                double durationSeconds = Double.parseDouble(duration);
                return VideoInfo.builder()
                        .duration((long) durationSeconds)
                        .durationFormatted(formatDuration((long) durationSeconds))
                        .build();
            }

            return null;
        } catch (Exception e) {
            log.error("동영상 정보 조회 실패", e);
            return null;
        }
    }

    /// 동영상 재생 가능 여부 확인
    public boolean isPlayableVideo(String ext) {
        return "mp4".equalsIgnoreCase(ext);
    }

    /// FFmpeg 설치 확인
    private boolean isFFmpegAvailable() {
        try {
            Process process = Runtime.getRuntime().exec("ffmpeg -version");
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /// 시간 포맷 변환 (초 → HH:MM:SS)
    private String formatDuration(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, secs);
    }

    /// 동영상 정보 DTO
    public static class VideoInfo {
        private Long duration; // 초 단위
        private String durationFormatted; // HH:MM:SS 형식

        public VideoInfo() {}

        public VideoInfo(Long duration, String durationFormatted) {
            this.duration = duration;
            this.durationFormatted = durationFormatted;
        }

        public static VideoInfoBuilder builder() {
            return new VideoInfoBuilder();
        }

        public Long getDuration() {
            return duration;
        }

        public String getDurationFormatted() {
            return durationFormatted;
        }

        public static class VideoInfoBuilder {
            private Long duration;
            private String durationFormatted;

            public VideoInfoBuilder duration(Long duration) {
                this.duration = duration;
                return this;
            }

            public VideoInfoBuilder durationFormatted(String durationFormatted) {
                this.durationFormatted = durationFormatted;
                return this;
            }

            public VideoInfo build() {
                return new VideoInfo(duration, durationFormatted);
            }
        }
    }
}
