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

    /**
     * 쿼리 로깅 인터셉터 등록 커스터마이저 빈.
     *
     * <p>{@code @Profile({"local","dev"})} 이므로 운영(prod)에서는 빈 자체가 생성되지 않아
     * 인터셉터 오버헤드가 전혀 없다. local/dev 에서만 {@link MyBatisQueryInterceptor} 를
     * MyBatis Configuration 에 추가해 실행 쿼리·결과 건수를 콘솔에 출력한다.</p>
     *
     * @return MyBatis Configuration 에 인터셉터를 추가하는 ConfigurationCustomizer 람다.
     *         앱 기동 시 1회 호출되며 인터셉터는 이후 모든 매핑 statement 에 적용됨
     */
    @Bean
    @Profile({"local", "dev"})
    public ConfigurationCustomizer myBatisQueryLoggingCustomizer() {
        log.info("[MyBatisConfig] MyBatisQueryInterceptor 등록 완료 — 쿼리 로깅 활성 (local/dev only)");
        return configuration -> configuration.addInterceptor(new MyBatisQueryInterceptor());
    }

    /**
     * 저장 메타데이터 자동 주입 인터셉터 등록 커스터마이저 빈.
     *
     * <p>프로파일 무관 전 환경 적용(쿼리 로깅과 달리 보안·정합성 정책이므로 운영에도 필수).
     * MyBatis INSERT/UPDATE 시 site_id 및 감사컬럼(regBy/regDate/updBy/updDate)을 서버에서
     * 강제 주입한다. JPA 경로의 EntitySaveListener 와 동일 정책(sy.57 §3.1)을 MyBatis
     * 경로에 보강하는 목적이다.</p>
     *
     * @return {@link MyBatisSaveMetaInterceptor} 를 추가하는 ConfigurationCustomizer 람다
     */
    @Bean
    public ConfigurationCustomizer myBatisSaveMetaCustomizer() {
        log.info("[MyBatisConfig] MyBatisSaveMetaInterceptor 등록 완료 — INSERT/UPDATE site_id·감사 자동 주입");
        return configuration -> configuration.addInterceptor(new MyBatisSaveMetaInterceptor());
    }
}
