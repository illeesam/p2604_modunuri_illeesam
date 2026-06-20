package com.shopjoy.ecadminapi.co.ext.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * 외부 연동 — 네이버 소셜 로그인 프로필 조회  /api/co/ext/sns-naver
 * CORS 문제로 프론트엔드에서 직접 네이버 API를 호출할 수 없어 백엔드 프록시 경유.
 */
@Slf4j
@RestController
@RequestMapping("/api/co/ext/sns-naver")
@RequiredArgsConstructor
public class CoExtSnsNaverController {

    private final ObjectMapper objectMapper;

    /** POST /api/co/ext/sns-naver/profile */
    @PostMapping("/profile")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> profile(@RequestBody Map<String, Object> body) {
        String accessToken = str(body, "accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.ok(ApiResponse.error(400, "accessToken 이 없습니다.", null));
        }

        try {
            String responseBody = RestClient.create()
                    .get()
                    .uri("https://openapi.naver.com/v1/nid/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> resp = objectMapper.readValue(responseBody, Map.class);
            Map<String, Object> profile = (Map<String, Object>) resp.get("response");

            log.info("[CoExtSnsNaver] 프로필 조회 완료 id={}", profile != null ? profile.get("id") : "null");

            return ResponseEntity.ok(ApiResponse.ok(profile));
        } catch (Exception e) {
            log.error("[CoExtSnsNaver] 프로필 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.error(400, "네이버 프로필 조회 실패: " + e.getMessage(), null));
        }
    }

    private static String str(Map<String, Object> m, String key) {
        Object v = m.get(key); return v == null ? null : v.toString().strip();
    }
}
