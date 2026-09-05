package com.shopjoy.ecadminapi.common.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.sql.*;
import java.util.*;

/**
 * sy_prop DB 에 저장된 값을 Spring Environment 에 주입.
 * EnvironmentPostProcessor 단계 = JPA/Spring Bean 초기화 이전 → 순수 JDBC 사용.
 *
 * 주입 대상 prefix:
 *   spring.mail.*   — JavaMailSender SMTP 연결 정보
 *   app.mail.*      — 발신자 표기 (from/from-nm)
 *   app.file.*      — 파일 스토리지 타입/CDN/AWS/NCP 키
 *   app.license.*   — 라이선스 시크릿/활성 여부 (secret 빈값이면 주입 건너뜀 → 환경변수 우선)
 *
 * 우선순위: 환경변수 > yml > sy_prop (addLast 로 가장 낮은 우선순위)
 * prop_profile 매칭: prop_profile 컬럼이 현재 활성 프로파일을 포함하는 행만 주입.
 *   예) prop_profile = '^local^dev^' 이면 local/dev 프로파일에서만 주입.
 *   prop_profile 이 null/blank 이면 모든 프로파일에 적용.
 * 빈 prop_value 는 주입 건너뜀 (yml 폴백 또는 환경변수 우선).
 */
public class SyPropEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String SOURCE_NAME = "syPropDbSource";

    private static final Set<String> TARGET_PREFIXES = Set.of(
        "spring.mail.",
        "app.mail.",
        "app.file.",
        "app.license."
    );

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE - 10;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        if (env.getPropertySources().contains(SOURCE_NAME)) return;

        String url      = env.getProperty("spring.datasource.url");
        String username = env.getProperty("spring.datasource.username");
        String password = env.getProperty("spring.datasource.password");
        if (url == null || url.isBlank()) return;

        // p6spy wrapper URL → 실제 JDBC URL
        if (url.startsWith("jdbc:p6spy:")) {
            url = "jdbc:" + url.substring("jdbc:p6spy:".length());
        }

        // 현재 활성 프로파일 목록 (없으면 "default")
        String[] activeProfiles = env.getActiveProfiles();
        if (activeProfiles.length == 0) activeProfiles = new String[]{"default"};

        Map<String, Object> props = loadProps(url, username, password, activeProfiles);
        if (props.isEmpty()) return;

        env.getPropertySources().addLast(new MapPropertySource(SOURCE_NAME, props));
        System.out.printf("[SyPropEnv] injected %d props from sy_prop (profiles: %s)%n",
            props.size(), String.join(",", activeProfiles));
    }

    private Map<String, Object> loadProps(String url, String user, String pass, String[] profiles) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            return result;
        }

        // 주입 대상 path_id 목록
        String pathFilter =
            "path_id IN ('spring.mail','app.mail','app.file','app.file.aws','app.file.ncp','app.license')";

        String sql = "SELECT prop_key, prop_value, prop_profile FROM shopjoy_2604.sy_prop " +
                     "WHERE use_yn = 'Y' AND prop_value IS NOT NULL AND prop_value <> '' " +
                     "AND " + pathFilter + " ORDER BY prop_key, prop_profile";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            // 같은 prop_key 에 여러 프로파일 행이 있을 수 있으므로
            // 프로파일 매칭된 첫 번째 값만 사용 (이미 주입된 키는 skip)
            while (rs.next()) {
                String key     = rs.getString("prop_key");
                String val     = rs.getString("prop_value");
                String profile = rs.getString("prop_profile"); // e.g. "^local^dev^"

                if (key == null || key.isBlank()) continue;
                if (!isTargetKey(key))           continue;
                if (result.containsKey(key))     continue; // 먼저 매칭된 프로파일 우선
                if (!matchesProfile(profile, profiles)) continue;

                result.put(key, val);
            }
        } catch (Exception e) {
            System.err.printf("[SyPropEnv] failed to load props: %s%n", e.getMessage());
        }
        return result;
    }

    /** prop_profile 이 현재 활성 프로파일 중 하나를 포함하는지 확인 */
    private boolean matchesProfile(String propProfile, String[] activeProfiles) {
        // prop_profile null/blank = 모든 프로파일 적용
        if (propProfile == null || propProfile.isBlank()) return true;
        for (String active : activeProfiles) {
            if (propProfile.contains("^" + active + "^")) return true;
        }
        return false;
    }

    private boolean isTargetKey(String key) {
        for (String prefix : TARGET_PREFIXES) {
            if (key.startsWith(prefix)) return true;
        }
        return false;
    }
}
