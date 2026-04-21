package com.shopjoy.ecadminapi.common.config;

import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.boot.autoconfigure.ConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * MyBatis 설정.
 * - @MapperScan 은 EcAdminApiApplication 에서 일괄 처리 (com.shopjoy.ecadminapi 전체)
 * - local/dev 프로파일에서만 쿼리 로깅 인터셉터 활성화 (운영 성능 영향 없음)
 */
@Slf4j
@Configuration
public class MyBatisConfig {

    /** local/dev 환경에서만 MyBatisQueryInterceptor를 등록해 쿼리 결과를 콘솔에 출력한다. */
    @Bean
    @Profile({"local", "dev"})
    public ConfigurationCustomizer myBatisQueryLoggingCustomizer() {
        log.info("[MyBatisConfig] MyBatisQueryInterceptor 등록 완료 — 쿼리 로깅 활성 (local/dev only)");
        return configuration -> configuration.addInterceptor(new MyBatisQueryInterceptor());
    }
}
