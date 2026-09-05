package com.shopjoy.ecBeBo;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@Slf4j
@SpringBootApplication
/* @MapperScan — @Mapper 인터페이스가 실제 존재하는 3개 패키지만 지정.
 * 루트("com.shopjoy.ecBeBo")로 두면 @Mapper 9개를 찾으려고 클래스 1600여 개를 전수 ASM 스캔한다
 * (@ComponentScan 과 별개로 한 번 더). 새 @Mapper 패키지를 추가하면 여기에도 등록할 것. */
@MapperScan(basePackages = {
        "com.shopjoy.ecBeBo.autorest.mapper",
        "com.shopjoy.ecBeBo.base.sy.mapper",
        "com.shopjoy.ecBeBo.base.zz.mapper"
}, annotationClass = Mapper.class)
public class EcBeBoApplication {

    public static void main(String[] args) {
        long started = System.currentTimeMillis();
        log.info("[EcBeBo] ===== 애플리케이션 시작 중 =====");

        ConfigurableApplicationContext ctx = SpringApplication.run(EcBeBoApplication.class, args);

        String profiles = String.join(", ", ctx.getEnvironment().getActiveProfiles());
        if (profiles.isBlank()) profiles = "default";
        String port = ctx.getEnvironment().getProperty("server.port", "8080");

        AppTableLog.run(ctx);

        long elapsed = System.currentTimeMillis() - started;
        log.info("⏱  [구동 완료] {}.{}초 ({} ms) — profile: [{}], port: {} ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ",
                elapsed / 1000, String.format("%03d", elapsed % 1000), elapsed, profiles, port);
        logSystemInfo();
    }

    /**
     * 부팅 직후 PC 하드웨어 사양과 JVM 힙 상태를 각각 한 줄로 출력한다.
     *
     * <p>이 메서드는 {@code [구동 완료]} 로그 <b>이후</b>에 호출되므로, 안에서 무엇을 하든
     * 위에 찍힌 부팅 시간 수치에는 영향을 주지 않는다.
     */
    private static void logSystemInfo() {
        Runtime rt = Runtime.getRuntime();

        /* ── PC 실장 메모리 — com.sun.management 확장 MXBean 에만 있다.
         *    표준 OperatingSystemMXBean 에는 물리 메모리 API 가 없어 캐스팅으로 확인한다. */
        String physMem = "확인불가";
        java.lang.management.OperatingSystemMXBean osBean = java.lang.management.ManagementFactory.getOperatingSystemMXBean();
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOs) {
            physMem = gb(sunOs.getTotalMemorySize()) + " (사용가능 " + gb(sunOs.getFreeMemorySize()) + ")";
        }

        log.info("🖥  [PC 사양] {} · {}코어 · 메모리 {} · {} {} ({})",
                cpuName(), rt.availableProcessors(), physMem,
                System.getProperty("os.name"), System.getProperty("os.version"), System.getProperty("os.arch"));

        /* ── JVM 힙 — Runtime 기준이라 Metaspace·다이렉트 버퍼는 빠진다.
         *    사용률은 "확보량" 이 아니라 "최대치(-Xmx)" 대비로 낸다. 확보량 대비로 내면 힙이 아직
         *    안 늘어난 부팅 직후에 90% 같은 값이 찍혀 OOM 임박처럼 오해된다. */
        long max   = rt.maxMemory();
        long total = rt.totalMemory();          // JVM 이 OS 로부터 지금까지 받아둔 양 (-Xms 에서 시작해 증가)
        long used  = total - rt.freeMemory();   // 그중 실제 사용 중인 양
        log.info("🧠 [JVM 힙] 사용 {} / 확보 {} / 최대 {} (최대 대비 {}%)",
                mb(used), mb(total), mb(max), used * 100 / max);
    }

    /**
     * CPU 모델명을 구한다.
     *
     * <p>Java 표준 API 에는 CPU 모델명이 없다. Windows 는 레지스트리에 마케팅 모델명
     * ("Intel(R) Core(TM) i7-9700 CPU @ 3.00GHz") 이 있어 {@code reg query} 로 읽는다(20ms 내외).
     * 실패하거나 비 Windows 면 {@code PROCESSOR_IDENTIFIER} 환경변수 → {@code os.arch} 순으로 폴백한다.
     * 부팅을 절대 막지 않도록 3초 타임아웃 + 예외 무시로 감쌌다.
     */
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

    /** 바이트 → "123MB" 형태 문자열. */
    private static String mb(long bytes) {
        return (bytes / 1024 / 1024) + "MB";
    }

    /** 바이트 → "31.9GB" 형태 문자열 (실장 메모리처럼 큰 값용). */
    private static String gb(long bytes) {
        return String.format("%.1fGB", bytes / 1024.0 / 1024.0 / 1024.0);
    }
}
