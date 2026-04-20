package com.shopjoy.ecadminapi.common.config;

import org.mybatis.spring.annotation.MapperScan;
import org.mybatis.spring.boot.autoconfigure.ConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * MyBatis 설정.
 * - autorest 패키지 하위 @Mapper 인터페이스를 자동 스캔
 * - local/dev 프로파일에서만 쿼리 로깅 인터셉터 활성화 (운영 성능 영향 없음)
 */
@Configuration
@MapperScan("com.shopjoy.ecadminapi.autorest")
public class MyBatisConfig {

    /** local/dev 환경에서만 MyBatisQueryInterceptor를 등록해 쿼리 결과를 콘솔에 출력한다. */
    @Bean
    @Profile({"local", "dev"})
    public ConfigurationCustomizer myBatisQueryLoggingCustomizer() {
        return configuration -> configuration.addInterceptor(new MyBatisQueryInterceptor());
    }
}
