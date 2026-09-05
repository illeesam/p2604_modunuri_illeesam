package com.shopjoy.ecBeCdn;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * EcBeCdn — 동영상 스트리밍 / 상품이미지 링크 / 파일 업로드 전용 CDN 서버.
 *
 * <p>EcBeBo 와 완전히 분리된 별도 배포 단위다. 최종 사용자(FO/BO 브라우저)가 이미지·동영상을
 * 직접 GET 으로 요청하는 "정적 서빙" 경로와, EcBeBo 가 accessToken 으로 인증해 파일을
 * 올리고 지우는 "관리 API" 경로 두 가지를 함께 담당한다.</p>
 *
 * <p>업로드 흐름: 브라우저 → EcBeBo(멀티파트 수신) → EcBeCdn(accessToken 인증 후 실제 저장).
 * EcBeCdn 는 EcBeBo 를 향한 CORS/세션 개념이 없다 — 완전히 서버-서버 통신이기 때문.</p>
 *
 * <p>UserDetailsServiceAutoConfiguration 제외: 폼로그인/인메모리 유저 개념이 전혀 없고(JWT
 * Bearer 만 씀) CfTokenAuthFilter 가 인증을 전담하므로, 안 막으면 Spring Boot 가 매 부팅마다
 * "generated security password" 를 만들어 로그에 찍는 무의미한 경고만 남는다.</p>
 *
 * <p>2026-09-06(요청사항: "구동완료에 각종 환경정보 및 정상체크정보 db 간단한 select 도
 * 표시해주면 좋겠어") — EcBeBo.EcBeBoApplication 의 부팅 완료 로그(소요시간/PC사양/JVM힙)와
 * CfAppTableLog(DB·Redis·저장소·JWT 헬스체크 표)를 그대로 이식했다.</p>
 */
@Slf4j
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class EcBeCdnApplication {

    public static void main(String[] args) {
        long started = System.currentTimeMillis();
        log.info("[EcBeCdn] ===== 애플리케이션 시작 중 =====");

        ConfigurableApplicationContext ctx = SpringApplication.run(EcBeCdnApplication.class, args);

        String profiles = String.join(", ", ctx.getEnvironment().getActiveProfiles());
        if (profiles.isBlank()) profiles = "default";
        String port = ctx.getEnvironment().getProperty("server.port", "8080");

        CfAppTableLog.run(ctx);

        long elapsed = System.currentTimeMillis() - started;
        log.info("⏱  [구동 완료] {}.{}초 ({} ms) — profile: [{}], port: {} ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ",
                elapsed / 1000, String.format("%03d", elapsed % 1000), elapsed, profiles, port);
        logSystemInfo();
    }

    /**
     * 부팅 직후 PC 하드웨어 사양과 JVM 힙 상태를 각각 한 줄로 출력한다.
     * EcBeBo.EcBeBoApplication 과 동일 로직(그대로 이식) — 두 앱이 같은 개발 PC/NAS에서
     * 나란히 뜨는 경우가 많아 형식을 통일해두면 로그 비교가 쉽다.
     */
    private static void logSystemInfo() {
        Runtime rt = Runtime.getRuntime();

        String physMem = "확인불가";
        java.lang.management.OperatingSystemMXBean osBean = java.lang.management.ManagementFactory.getOperatingSystemMXBean();
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOs) {
            physMem = gb(sunOs.getTotalMemorySize()) + " (사용가능 " + gb(sunOs.getFreeMemorySize()) + ")";
        }

        log.info("🖥  [PC 사양] {} · {}코어 · 메모리 {} · {} {} ({})",
                cpuName(), rt.availableProcessors(), physMem,
                System.getProperty("os.name"), System.getProperty("os.version"), System.getProperty("os.arch"));

        long max   = rt.maxMemory();
        long total = rt.totalMemory();
        long used  = total - rt.freeMemory();
        log.info("🧠 [JVM 힙] 사용 {} / 확보 {} / 최대 {} (최대 대비 {}%)",
                mb(used), mb(total), mb(max), used * 100 / max);
    }

    private static String cpuName() {
        if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
            try {
                Process p = new ProcessBuilder("reg", "query",
                        "HKLM\\HARDWARE\\DESCRIPTION\\System\\CentralProcessor\\0", "/v", "ProcessorNameString")
                        .redirectErrorStream(true).start();
                String out = new String(p.getInputStream().readAllBytes(), java.nio.charset.Charset.defaultCharset());
                p.waitFor(3, java.util.concurrent.TimeUnit.SECONDS);
                int idx = out.indexOf("REG_SZ");
                if (idx >= 0) {
                    String name = out.substring(idx + "REG_SZ".length()).trim();
                    if (!name.isBlank()) return name;
                }
            } catch (Exception ignore) {
                /* 레지스트리 조회 실패는 기능에 영향 없음 — 아래 폴백으로 진행 */
            }
        }
        String ident = System.getenv("PROCESSOR_IDENTIFIER");
        return (ident != null && !ident.isBlank()) ? ident : System.getProperty("os.arch", "unknown");
    }

    private static String mb(long bytes) {
        return (bytes / 1024 / 1024) + "MB";
    }

    private static String gb(long bytes) {
        return String.format("%.1fGB", bytes / 1024.0 / 1024.0 / 1024.0);
    }
}
