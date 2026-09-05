package com.shopjoy.ecBeBo.co.log.util;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 로그 파일 tail(마지막 N줄) 유틸 — 로그뷰어(요청사항: "배포 후 로그화면보는 url", 인증없이
 * 누구나 조회) 전용. EcCdnApi 의 {@code com.shopjoy.eccdnapi.log.util.CfLogTailUtil} 을 그대로
 * 포팅했다(요청사항: "EcCdnApi 프로그램 참고해줘"). 롤링 정책상 파일이 최대 수백MB 까지 커질 수
 * 있어 전체를 메모리에 올리지 않고, 파일 끝에서 최대 {@link #MAX_READ_BYTES} 만큼만 읽어 그 안에서
 * 줄 단위로 tail 한다 — 개발용 도구라 매 요청마다 정확히 N줄 보장보다 "안전하게 빠르게" 를 우선했다.
 */
public final class LogTailUtil {

    private static final long MAX_READ_BYTES = 4L * 1024 * 1024; // 4MB
    private static final int MAX_LINES = 2000;

    private LogTailUtil() {}

    public static List<String> tail(Path path, int requestedLines) {
        if (path == null || !Files.exists(path)) return List.of();
        int n = Math.min(Math.max(requestedLines, 1), MAX_LINES);
        try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "r")) {
            long len = raf.length();
            if (len == 0) return List.of();
            long start = Math.max(0, len - MAX_READ_BYTES);
            raf.seek(start);
            byte[] buf = new byte[(int) (len - start)];
            raf.readFully(buf);
            String content = new String(buf, StandardCharsets.UTF_8);
            String[] all = content.split("\n", -1);
            int from = Math.max(0, all.length - n);
            List<String> result = new ArrayList<>(Arrays.asList(all).subList(from, all.length));
            if (start > 0 && from == 0 && !result.isEmpty()) result.remove(0);
            if (!result.isEmpty() && result.get(result.size() - 1).isEmpty()) result.remove(result.size() - 1);
            return result;
        } catch (IOException e) {
            return List.of("[로그 읽기 실패] " + e.getMessage());
        }
    }

    public static long sizeOf(Path path) {
        try {
            return Files.exists(path) ? Files.size(path) : 0L;
        } catch (IOException e) {
            return 0L;
        }
    }

    public static long lastModifiedOf(Path path) {
        try {
            return Files.exists(path) ? Files.getLastModifiedTime(path).toMillis() : 0L;
        } catch (IOException e) {
            return 0L;
        }
    }
}
