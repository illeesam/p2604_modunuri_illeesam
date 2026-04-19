package com.shopjoy.ecadminapi.config;

import org.mybatis.spring.annotation.MapperScan;
import org.mybatis.spring.boot.autoconfigure.ConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@MapperScan("com.shopjoy.ecadminapi.autorest")
public class MyBatisConfig {

    @Bean
    @Profile({"local", "dev"})
    public ConfigurationCustomizer myBatisQueryLoggingCustomizer() {
        return configuration -> configuration.addInterceptor(new MyBatisQueryInterceptor());
    }
}
