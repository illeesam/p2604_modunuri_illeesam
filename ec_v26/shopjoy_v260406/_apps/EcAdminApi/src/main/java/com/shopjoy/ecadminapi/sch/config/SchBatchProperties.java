package com.shopjoy.ecadminapi.sch.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.scheduler")
public class SchBatchProperties {

    /**
     * 동적 배치 스케줄러 활성 여부.
     * false → 앱 기동 시 sy_batch cron 등록 생략. 수동 API 실행도 비활성.
     */
    private boolean enabled = true;

    private Jenkins jenkins = new Jenkins();

    /**
     * 스케줄러 관리 API 허용 IP.
     * "*" = 전체 허용 | "127.0.0.1^10.0.0.1" = ^ 구분 IP 화이트리스트 | "" = 전체 허용
     */
    private String allowedIps = "";

    @Data
    public static class Jenkins {
        /**
         * Jenkins 외부 호출 모드 활성 여부.
         * true  → cron 자동 스케줄 등록 생략. Jenkins가 /api/sch/jenkins/{batchCode} 를 직접 호출.
         * false → 내부 cron 스케줄러가 자동 실행.
         *
         * ※ 두 모드는 배타적으로 동작:
         *    jenkins.enabled=true  이면 SchBatchJobRegistry.register() 가 cron 등록을 건너뜀.
         *    jenkins.enabled=false 이면 /api/sch/jenkins/* 엔드포인트가 403 반환.
         */
        private boolean enabled = false;

        /**
         * Jenkins → 앱 호출 시 사용하는 공유 토큰 (Bearer 방식).
         * Jenkins Pipeline: httpRequest customHeaders: [[name:'X-Jenkins-Token', value:'<token>']]
         * 운영: 환경변수 ${JENKINS_BATCH_TOKEN} 으로 주입 권장.
         */
        private String token = "";

        /**
         * 앱 → Jenkins 역방향 트리거 URL (미사용 시 빈 값).
         * 예: http://jenkins.internal:8080/job/batch-{batchCode}/build?token=xxx
         * 현재는 참조 전용. 향후 Jenkins 빌드 트리거 연동 시 활성화.
         */
        private String url = "";

        public boolean hasToken() {
            return token != null && !token.isBlank();
        }

        public boolean isTokenValid(String incoming) {
            return hasToken() && token.equals(incoming);
        }
    }

    public List<String> getAllowedIpList() {
        if (allowedIps == null || allowedIps.isBlank()) return List.of();
        return Arrays.asList(allowedIps.split("\\^"));
    }

    public boolean isIpAllowed(String ip) {
        if ("*".equals(allowedIps != null ? allowedIps.trim() : "")) return true;
        List<String> list = getAllowedIpList();
        return list.isEmpty() || list.contains(ip);
    }
}
