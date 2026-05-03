package com.shopjoy.ecadminapi.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger(SpringDoc) 그룹 설정.
 *
 * Swagger UI 드롭다운에서 그룹별로 API를 선택하여 조회할 수 있다:
 *   ALL      — 전체 API
 *   CO       — 공통 API (누구나 접근, /api/co/**)
 *   BO       — 관리자 API (BO만 접근, /api/bo/**)
 *   FO       — 회원 API (FO만 접근, /api/fo/**)
 *   BASE     — 내부 레이어 (외부 접근 차단, /api/base/**)
 *   EXT      — 외부 시스템 API (/api/ext/**)
 *   AUTOREST — 자동 REST API (/api/autoRest/**)
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("ShopJoy EcAdminApi")
                .description("ShopJoy 전자상거래 플랫폼 API")
                .version("v2604"));
    }

    @Bean
    public GroupedOpenApi groupAll() {
        return GroupedOpenApi.builder()
            .group("00. ALL")
            .pathsToMatch("/api/**", "/api/autoRest/**")
            .build();
    }

    @Bean
    public GroupedOpenApi groupCo() {
        return GroupedOpenApi.builder()
            .group("01. CO — 공통 (누구나)")
            .pathsToMatch("/api/co/**")
            .build();
    }

    @Bean
    public GroupedOpenApi groupBo() {
        return GroupedOpenApi.builder()
            .group("02. BO — 관리자")
            .pathsToMatch("/api/bo/**")
            .build();
    }

    @Bean
    public GroupedOpenApi groupFo() {
        return GroupedOpenApi.builder()
            .group("03. FO — 회원")
            .pathsToMatch("/api/fo/**")
            .build();
    }

    @Bean
    public GroupedOpenApi groupBase() {
        return GroupedOpenApi.builder()
            .group("04. BASE — 내부 레이어 (외부 차단)")
            .pathsToMatch("/api/base/**")
            .build();
    }

    @Bean
    public GroupedOpenApi groupExt() {
        return GroupedOpenApi.builder()
            .group("05. EXT — 외부 시스템")
            .pathsToMatch("/api/ext/**")
            .build();
    }

    @Bean
    public GroupedOpenApi groupAutoRest() {
        return GroupedOpenApi.builder()
            .group("06. AUTOREST — 자동 REST")
            .pathsToMatch("/api/autoRest/**")
            .build();
    }
}
