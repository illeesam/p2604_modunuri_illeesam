package com.shopjoy.ecadminapi.sch.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.scheduler")
public class SchBatchProperties {

    private boolean enabled = true;
    private Jenkins jenkins = new Jenkins();
    private String allowedIps = "";

    @Data
    public static class Jenkins {
        private boolean enabled = false;
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
