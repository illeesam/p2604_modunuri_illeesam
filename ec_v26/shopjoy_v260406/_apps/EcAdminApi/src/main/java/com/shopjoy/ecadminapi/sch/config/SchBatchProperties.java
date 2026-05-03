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

    private SchJenkinsProperties jenkins = new SchJenkinsProperties();

    /**
     * 스케줄러 관리 API 허용 IP.
     * "*" = 전체 허용 | "127.0.0.1^10.0.0.1" = ^ 구분 IP 화이트리스트 | "" = 전체 허용
     */
    private String allowedIps = "";

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
