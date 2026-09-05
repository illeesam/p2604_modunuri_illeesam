package com.shopjoy.ecadminapi.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 동영상 처리 유틸 — 포맷 변환, 썸네일 생성, 메타데이터 조회.
 *
 * <p>역할/책임: 외부 FFmpeg/FFprobe 프로세스를 호출해 동영상을 스트리밍용 H.264 MP4 로
 * 변환하거나 첫 프레임 썸네일을 추출한다.
 *
 * <p>언제 쓰이는지: 동영상 첨부 업로드 후처리(트랜스코딩/썸네일) 단계.
 *
 * <p>주의사항:
 * <ul>
 *   <li>FFmpeg 가 PATH 에 없으면 변환/썸네일은 동작하지 않고 안전하게 fallback(원본 반환/false) 한다.</li>
 *   <li>{@link Runtime#exec(String)} 사용 — inputPath/outputPath 는 신뢰된 내부 경로만 전달할 것
 *       (외부 입력을 그대로 넘기면 명령 주입 위험).</li>
 *   <li>예외는 던지지 않고 로깅 후 안전한 기본값을 반환한다(업로드 흐름을 막지 않기 위함).</li>
 * </ul>
 */
@Slf4j
@Component
public class VideoConvertUtil {

    /** 처리 가능한 동영상 포맷. 소문자 비교 전제. */
    private static final Set<String> SUPPORTED_VIDEO_FORMATS = new HashSet<>(
            Arrays.asList("mp4", "avi", "mov", "mkv", "webm", "flv", "wmv", "m4v"));

    /**
     * 동영상 파일 지원 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return 지원 포맷이면 true
     */
    public boolean isSupportedVideo(String ext) {
        return SUPPORTED_VIDEO_FORMATS.contains(ext.toLowerCase());
    }

    /**
     * 동영상 썸네일 생성 가능 여부 (실제 추출은 FFmpeg 설치 필요).
     *
     * @param ext 확장자(대소문자 무관)
     * @return 지원 포맷이면 true
     */
    public boolean canGenerateVideoThumbnail(String ext) {
        return isSupportedVideo(ext);
    }

    /**
     * 동영상 파일 여부.
     *
     * @param ext 확장자(대소문자 무관)
     * @return 지원 포맷이면 true
     */
    public boolean isVideoFile(String ext) {
        return isSupportedVideo(ext);
    }

    /**
     * 동영상을 H.264 MP4로 변환 (스트리밍 최적화).
     *
     * <p>libx264 + AAC, {@code +faststart} 로 moov atom 을 앞으로 이동시켜 점진적 스트리밍을 가능하게 한다.
     * FFmpeg 미설치 시 변환을 건너뛰고 원본 경로를 반환한다(업로드 흐름 비차단).
     *
     * @param inputPath  원본 동영상 물리 경로 (신뢰된 내부 경로만)
     * @param outputPath 변환 결과 저장 경로
     * @return 성공 시 outputPath, FFmpeg 미설치/변환 실패/예외 시 inputPath(원본)
     */
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

    /**
     * 동영상 썸네일 생성 (1초 지점 프레임 1장).
     *
     * <p>1초 지점({@code -ss 00:00:01})에서 200x200 으로 스케일한 단일 프레임을 추출한다.
     * 0초가 아닌 1초를 쓰는 이유: 영상 선두의 검은 프레임/페이드인을 회피하기 위함.
     *
     * @param videoPath 원본 동영상 물리 경로
     * @param thumbPath 썸네일 저장 경로
     * @return 성공 시 true, FFmpeg 미설치/실패/예외 시 false
     */
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

    /**
     * 동영상 정보 조회 (재생 길이).
     *
     * <p>FFprobe 로 format.duration(초) 만 추출해 {@link VideoInfo} 로 반환한다.
     * 메서드명은 "비트레이트 등"을 포함하나 현재 구현은 duration 만 채운다.
     *
     * @param videoPath 동영상 물리 경로
     * @return 길이 정보를 담은 VideoInfo. FFmpeg 미설치/길이 미확인/예외 시 null
     */
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

    /**
     * 브라우저에서 변환 없이 바로 재생 가능한지 여부.
     *
     * <p>현재는 mp4 만 무변환 재생 대상으로 간주(가장 호환성이 높음).
     *
     * @param ext 확장자(대소문자 무관)
     * @return mp4 면 true
     */
    public boolean isPlayableVideo(String ext) {
        return "mp4".equalsIgnoreCase(ext);
    }

    /**
     * FFmpeg 설치 확인.
     *
     * <p>{@code ffmpeg -version} 실행 후 종료 코드 0 이면 사용 가능으로 판단.
     * 미설치/실행 불가 시 예외를 삼키고 false 반환(상위 메서드의 안전 fallback 기준).
     *
     * @return FFmpeg 사용 가능하면 true
     */
    private boolean isFFmpegAvailable() {
        try {
            Process process = Runtime.getRuntime().exec("ffmpeg -version");
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 시간 포맷 변환 (초 → HH:MM:SS).
     *
     * @param seconds 총 초
     * @return zero-pad 된 {@code HH:MM:SS} 문자열
     */
    private String formatDuration(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, secs);
    }

    /**
     * 동영상 정보 DTO.
     *
     * <p>현재는 재생 길이(초/포맷 문자열)만 담는다. 빌더 패턴 제공.
     */
    public static class VideoInfo {
        /** 재생 길이(초 단위). */
        private Long duration; // 초 단위
        /** 재생 길이 HH:MM:SS 표기 문자열. */
        private String durationFormatted; // HH:MM:SS 형식

        /** 기본 생성자 (필드 미설정). */
        public VideoInfo() {}

        /**
         * 전체 필드 생성자.
         *
         * @param duration          재생 길이(초)
         * @param durationFormatted HH:MM:SS 표기 문자열
         */
        public VideoInfo(Long duration, String durationFormatted) {
            this.duration = duration;
            this.durationFormatted = durationFormatted;
        }

        /**
         * 빌더 생성.
         *
         * @return 새 {@link VideoInfoBuilder}
         */
        public static VideoInfoBuilder builder() {
            return new VideoInfoBuilder();
        }

        /**
         * 재생 길이(초) 조회.
         *
         * @return 길이(초), 미설정 시 null
         */
        public Long getDuration() {
            return duration;
        }

        /**
         * 재생 길이 포맷 문자열 조회.
         *
         * @return HH:MM:SS 문자열, 미설정 시 null
         */
        public String getDurationFormatted() {
            return durationFormatted;
        }

        /**
         * {@link VideoInfo} 빌더.
         */
        public static class VideoInfoBuilder {
            private Long duration;
            private String durationFormatted;

            /**
             * 재생 길이(초) 설정.
             *
             * @param duration 길이(초)
             * @return this (체이닝)
             */
            public VideoInfoBuilder duration(Long duration) {
                this.duration = duration;
                return this;
            }

            /**
             * 재생 길이 포맷 문자열 설정.
             *
             * @param durationFormatted HH:MM:SS 문자열
             * @return this (체이닝)
             */
            public VideoInfoBuilder durationFormatted(String durationFormatted) {
                this.durationFormatted = durationFormatted;
                return this;
            }

            /**
             * 누적 값으로 {@link VideoInfo} 생성.
             *
             * @return 구성된 VideoInfo
             */
            public VideoInfo build() {
                return new VideoInfo(duration, durationFormatted);
            }
        }
    }
}
