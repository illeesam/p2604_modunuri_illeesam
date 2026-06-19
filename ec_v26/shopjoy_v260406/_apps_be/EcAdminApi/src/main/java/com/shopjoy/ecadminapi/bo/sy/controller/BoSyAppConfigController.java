package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * BO application.yml 설정 조회 API — /api/bo/sy/app-config
 * 개발도구 테스트 화면에서 현재 서버에 적용된 yml 값을 확인하는 용도.
 * 민감값(secret-key 등)은 마스킹 처리.
 */
@RestController
@RequestMapping("/api/bo/sy/app-config")
@RequiredArgsConstructor
public class BoSyAppConfigController {

    /* ── 소셜 로그인 ── */
    @Value("${auth.social.google-userinfo-url:}") private String googleUserinfoUrl;
    @Value("${auth.social.kakao-userinfo-url:}")  private String kakaoUserinfoUrl;
    @Value("${auth.social.naver-userinfo-url:}")  private String naverUserinfoUrl;
    @Value("${auth.social.default-site-id:}")     private String socialDefaultSiteId;

    /* ── 토스페이먼츠 ── */
    @Value("${toss.confirm-url:}")     private String tossConfirmUrl;
    @Value("${toss.cancel-url-base:}") private String tossCancelUrlBase;
    @Value("${toss.secret-key:}")      private String tossSecretKey;
    @Value("${toss.client-key:}")      private String tossClientKey;

    /* ── 지도 ── */
    @Value("${map.kakao-js-key:}")        private String kakaoJsKey;
    @Value("${map.naver-map-client-id:}") private String naverMapClientId;

    /* ── 메일(SMTP) ── */
    @Value("${spring.mail.host:}")     private String mailHost;
    @Value("${spring.mail.port:}")     private String mailPort;
    @Value("${spring.mail.username:}") private String mailUsername;
    @Value("${app.mail.from:}")        private String mailFrom;
    @Value("${app.mail.from-nm:}")     private String mailFromNm;

    /* ── 카카오 알림톡 ── */
    @Value("${kakao.alimtalk.sender-key:}") private String kakaoAlimtalkSenderKey;

    /** 공통: key-value 행 목록 반환 포맷 */
    private Map<String, String> row(String key, String value, boolean mask) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("ymlKey", key);
        m.put("ymlValue", mask ? maskSecret(value) : (value == null || value.isBlank() ? "(미설정)" : value));
        return m;
    }

    private String maskSecret(String v) {
        if (v == null || v.isBlank()) return "(미설정)";
        if (v.length() <= 8) return "****";
        return v.substring(0, 4) + "****" + v.substring(v.length() - 4);
    }

    /** 소셜 로그인 공통 (Google / Kakao / Naver 공통) */
    @GetMapping("/social")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> social() {
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            row("auth.social.google-userinfo-url", googleUserinfoUrl, false),
            row("auth.social.kakao-userinfo-url",  kakaoUserinfoUrl,  false),
            row("auth.social.naver-userinfo-url",  naverUserinfoUrl,  false),
            row("auth.social.default-site-id",     socialDefaultSiteId, false)
        )));
    }

    /** 토스페이먼츠 */
    @GetMapping("/toss")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> toss() {
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            row("toss.confirm-url",     tossConfirmUrl,     false),
            row("toss.cancel-url-base", tossCancelUrlBase,  false),
            row("toss.client-key",      tossClientKey,      false),
            row("toss.secret-key",      tossSecretKey,      true)
        )));
    }

    /** 지도 */
    @GetMapping("/map")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> map() {
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            row("map.kakao-js-key",        kakaoJsKey,        false),
            row("map.naver-map-client-id", naverMapClientId,  false)
        )));
    }

    /** 메일(SMTP) */
    @GetMapping("/mail")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> mail() {
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            row("spring.mail.host",     mailHost,     false),
            row("spring.mail.port",     mailPort,     false),
            row("spring.mail.username", mailUsername, false),
            row("app.mail.from",        mailFrom,     false),
            row("app.mail.from-nm",     mailFromNm,   false)
        )));
    }

    /** 카카오 알림톡 */
    @GetMapping("/kakao")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> kakao() {
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            row("kakao.alimtalk.sender-key", kakaoAlimtalkSenderKey, true)
        )));
    }

    /** 대시보드 — 전체 연동 설정 한 번에 조회 */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> all() {
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            row("auth.social.google-userinfo-url", googleUserinfoUrl,      false),
            row("auth.social.kakao-userinfo-url",  kakaoUserinfoUrl,       false),
            row("auth.social.naver-userinfo-url",  naverUserinfoUrl,       false),
            row("auth.social.default-site-id",     socialDefaultSiteId,    false),
            row("toss.confirm-url",                tossConfirmUrl,         false),
            row("toss.cancel-url-base",            tossCancelUrlBase,      false),
            row("toss.client-key",                 tossClientKey,          false),
            row("toss.secret-key",                 tossSecretKey,          true),
            row("map.kakao-js-key",                kakaoJsKey,             false),
            row("map.naver-map-client-id",         naverMapClientId,       false),
            row("spring.mail.host",                mailHost,               false),
            row("spring.mail.port",                mailPort,               false),
            row("spring.mail.username",            mailUsername,           false),
            row("app.mail.from",                   mailFrom,               false),
            row("app.mail.from-nm",                mailFromNm,             false),
            row("kakao.alimtalk.sender-key",       kakaoAlimtalkSenderKey, true)
        )));
    }
}
