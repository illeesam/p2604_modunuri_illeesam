package com.shopjoy.ecadminapi;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@Slf4j
@SpringBootApplication
@MapperScan(
    basePackages = {"com.shopjoy.ecadminapi"},
    annotationClass = Mapper.class
)
public class EcAdminApiApplication {

    public static void main(String[] args) {
        log.info("[EcAdminApi] ===== 애플리케이션 시작 중 =====");
        ConfigurableApplicationContext ctx = SpringApplication.run(EcAdminApiApplication.class, args);
        String profiles = String.join(", ", ctx.getEnvironment().getActiveProfiles());
        if (profiles.isBlank()) profiles = "default";
        log.info("[EcAdminApi] ===== 애플리케이션 구동 완료 ... 2026-04-22 05:54  — active profiles: [{}] =====", profiles);
    }
}
