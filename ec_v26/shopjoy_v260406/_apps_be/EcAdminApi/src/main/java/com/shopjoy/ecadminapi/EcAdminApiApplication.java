package com.shopjoy.ecadminapi;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@Slf4j
@SpringBootApplication
@MapperScan(basePackages = "com.shopjoy.ecadminapi", annotationClass = Mapper.class)
public class EcAdminApiApplication {

    public static void main(String[] args) {
        long started = System.currentTimeMillis();
        log.info("[EcAdminApi] ===== 애플리케이션 시작 중 =====");

        ConfigurableApplicationContext ctx = SpringApplication.run(EcAdminApiApplication.class, args);

        String profiles = String.join(", ", ctx.getEnvironment().getActiveProfiles());
        if (profiles.isBlank()) profiles = "default";
        String port = ctx.getEnvironment().getProperty("server.port", "8080");

        AppTableLog.run(ctx);

        long elapsed = System.currentTimeMillis() - started;
        log.info("⏱  [구동 완료] {}.{}초 ({} ms) — profile: [{}], port: {} ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ✦✦✦✦✦ ",
                elapsed / 1000, String.format("%03d", elapsed % 1000), elapsed, profiles, port);
    }
}
