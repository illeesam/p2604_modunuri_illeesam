package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * BO application.yml 설정 조회 API — /api/bo/sy/app-config
 * 개발도구 테스트 화면에서 현재 서버에 적용된 설정값을 확인하는 용도.
 *
 * 조회 우선순위: sy_prop DB (use_yn=Y + profile 매칭) → yml @Value 폴백
 * propKey = yml 경로 그대로 (역전환 시 키 변환 없음)
 * 민감값(SECRET 타입 또는 *-key/*-password)은 마스킹 처리.
 */
@RestController
@RequestMapping("/api/bo/sy/app-config")
@RequiredArgsConstructor
public class BoSyAppConfigController {

    private final SyPropRepository syPropRepository;
    private final Environment environment;

    /* ── yml 폴백값 ── */
    @Value("${app.auth.social.google-userinfo-url:}") private String googleUserinfoUrl;
    @Value("${app.auth.social.kakao-userinfo-url:}")  private String kakaoUserinfoUrl;
    @Value("${app.auth.social.naver-userinfo-url:}")  private String naverUserinfoUrl;
    @Value("${app.auth.social.default-site-id:}")     private String socialDefaultSiteId;

    @Value("${app.toss.confirm-url:}")     private String tossConfirmUrl;
    @Value("${app.toss.cancel-url-base:}") private String tossCancelUrlBase;
    @Value("${app.toss.secret-key:}")      private String tossSecretKey;
    @Value("${app.toss.client-key:}")      private String tossClientKey;

    @Value("${app.map.kakao-js-key:}")        private String kakaoJsKey;
    @Value("${app.map.naver-map-client-id:}") private String naverMapClientId;

    @Value("${spring.mail.host:}")     private String mailHost;
    @Value("${spring.mail.port:}")     private String mailPort;
    @Value("${spring.mail.username:}") private String mailUsername;
    @Value("${app.mail.from:}")        private String mailFrom;
    @Value("${app.mail.from-nm:}")     private String mailFromNm;

    @Value("${app.kakao.alimtalk.sender-key:}") private String kakaoAlimtalkSenderKey;

    @Value("${app.file.storage-type:LOCAL}") private String fileStorageType;
    @Value("${app.file.cdn-host:}")          private String fileCdnHost;
    @Value("${app.file.aws.bucket-name:}")   private String awsBucketName;
    @Value("${app.file.aws.region:}")        private String awsRegion;
    @Value("${app.file.aws.access-key:}")    private String awsAccessKey;
    @Value("${app.file.aws.secret-key:}")    private String awsSecretKey;
    @Value("${app.file.aws.cdn-url:}")       private String awsCdnUrl;
    @Value("${app.file.ncp.bucket-name:}")   private String ncpBucketName;
    @Value("${app.file.ncp.endpoint:}")      private String ncpEndpoint;
    @Value("${app.file.ncp.access-key:}")    private String ncpAccessKey;
    @Value("${app.file.ncp.secret-key:}")    private String ncpSecretKey;
    @Value("${app.file.ncp.cdn-url:}")       private String ncpCdnUrl;

    /* ════════════════════════════════════════════════════════
       내부 헬퍼
    ════════════════════════════════════════════════════════ */

    /** 현재 active profile */
    private String activeProfile() {
        String[] profiles = environment.getActiveProfiles();
        return (profiles != null && profiles.length > 0) ? profiles[0] : "-";
    }

    /**
     * propProfile 매칭 — 비어있으면 전체 적용.
     * 형식: "^local^dev^" → local 또는 dev 환경에서만 적용
     */
    private boolean isProfileMatch(String propProfile, String active) {
        if (propProfile == null || propProfile.isBlank()) return true;
        if (active == null || active.isBlank()) return true;
        return propProfile.contains("^" + active + "^");
    }

    /** 전체 sy_prop를 propKey → propValue 맵으로 로드 (현재 profile 매칭) */
    private Map<String, String> loadDbProps() {
        String active = activeProfile();
        return syPropRepository.findAll().stream()
                .filter(p -> "Y".equals(p.getUseYn())
                        && p.getPropKey() != null
                        && p.getPropValue() != null
                        && isProfileMatch(p.getPropProfile(), active))
                .collect(Collectors.toMap(
                        SyProp::getPropKey,
                        SyProp::getPropValue,
                        (o, n) -> n   // 프로파일 중복 시 나중 값 우선
                ));
    }

    private Map<String, String> row(String key, String value, boolean mask, String source) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("ymlKey", key);
        boolean empty = (value == null || value.isBlank());
        m.put("ymlValue", empty ? "(미설정)" : (mask ? maskSecret(value) : value));
        m.put("source", empty ? "(미설정)" : (source != null ? source : "YML"));
        return m;
    }

    /** resolve + source 추적 */
    private Map<String, String> rowResolved(Map<String, String> dbProps, String propKey, String ymlFallback, boolean mask) {
        String dbVal = dbProps.get(propKey);
        boolean fromDb = (dbVal != null && !dbVal.isBlank());
        String value  = fromDb ? dbVal : ymlFallback;
        return row(propKey, value, mask, fromDb ? "DB" : "YML");
    }

    /** SECRET / password / access-key / secret-key 등 민감값 마스킹 */
    private String maskSecret(String v) {
        if (v == null || v.isBlank()) return "(미설정)";
        if (v.length() <= 8) return "****";
        return v.substring(0, 4) + "****" + v.substring(v.length() - 4);
    }

    /** propKey가 SECRET 타입 여부 판별 (키 이름 패턴 기준) */
    private boolean isSecret(String key) {
        String k = key.toLowerCase();
        return k.endsWith("secret-key") || k.endsWith("access-key")
                || k.endsWith("password") || k.endsWith("secret");
    }

    /* ════════════════════════════════════════════════════════
       엔드포인트
    ════════════════════════════════════════════════════════ */

    /** 소셜 로그인 공통 (Google / Kakao / Naver) */
    @GetMapping("/social")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> social() {
        Map<String, String> db = loadDbProps();
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            rowResolved(db, "app.auth.social.google-userinfo-url", googleUserinfoUrl, false),
            rowResolved(db, "app.auth.social.kakao-userinfo-url",  kakaoUserinfoUrl,  false),
            rowResolved(db, "app.auth.social.naver-userinfo-url",  naverUserinfoUrl,  false),
            rowResolved(db, "app.auth.social.default-site-id",     socialDefaultSiteId, false)
        )));
    }

    /** 토스페이먼츠 */
    @GetMapping("/toss")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> toss() {
        Map<String, String> db = loadDbProps();
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            rowResolved(db, "app.toss.confirm-url",     tossConfirmUrl,    false),
            rowResolved(db, "app.toss.cancel-url-base", tossCancelUrlBase, false),
            rowResolved(db, "app.toss.client-key",      tossClientKey,     false),
            rowResolved(db, "app.toss.secret-key",      tossSecretKey,     true)
        )));
    }

    /** 지도 */
    @GetMapping("/map")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> map() {
        Map<String, String> db = loadDbProps();
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            rowResolved(db, "app.map.kakao-js-key",        kakaoJsKey,       false),
            rowResolved(db, "app.map.naver-map-client-id", naverMapClientId, false)
        )));
    }

    /** 메일(SMTP) */
    @GetMapping("/mail")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> mail() {
        Map<String, String> db = loadDbProps();
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            rowResolved(db, "spring.mail.host",     mailHost,     false),
            rowResolved(db, "spring.mail.port",     mailPort,     false),
            rowResolved(db, "spring.mail.username", mailUsername, false),
            rowResolved(db, "spring.mail.password", "",           true),
            rowResolved(db, "app.mail.from",        mailFrom,     false),
            rowResolved(db, "app.mail.from-nm",     mailFromNm,   false)
        )));
    }

    /** 카카오 알림톡 */
    @GetMapping("/kakao")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> kakao() {
        Map<String, String> db = loadDbProps();
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            rowResolved(db, "app.kakao.alimtalk.sender-key", kakaoAlimtalkSenderKey, true)
        )));
    }

    /** 파일 저장소 (LOCAL / AWS S3 / NCP OBS) */
    @GetMapping("/file")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> file() {
        Map<String, String> db = loadDbProps();
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            rowResolved(db, "app.file.storage-type",    fileStorageType, false),
            rowResolved(db, "app.file.cdn-host",        fileCdnHost,     false),
            // AWS S3
            rowResolved(db, "app.file.aws.bucket-name", awsBucketName, false),
            rowResolved(db, "app.file.aws.region",      awsRegion,      false),
            rowResolved(db, "app.file.aws.access-key",  awsAccessKey,   true),
            rowResolved(db, "app.file.aws.secret-key",  awsSecretKey,   true),
            rowResolved(db, "app.file.aws.cdn-url",     awsCdnUrl,      false),
            // NCP OBS
            rowResolved(db, "app.file.ncp.bucket-name", ncpBucketName, false),
            rowResolved(db, "app.file.ncp.endpoint",    ncpEndpoint,    false),
            rowResolved(db, "app.file.ncp.access-key",  ncpAccessKey,   true),
            rowResolved(db, "app.file.ncp.secret-key",  ncpSecretKey,   true),
            rowResolved(db, "app.file.ncp.cdn-url",     ncpCdnUrl,      false)
        )));
    }

    /** 대시보드 — 전체 연동 설정 한 번에 조회 */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> all() {
        Map<String, String> db = loadDbProps();
        return ResponseEntity.ok(ApiResponse.ok(List.of(
            // 소셜
            rowResolved(db, "app.auth.social.google-userinfo-url", googleUserinfoUrl,  false),
            rowResolved(db, "app.auth.social.kakao-userinfo-url",  kakaoUserinfoUrl,   false),
            rowResolved(db, "app.auth.social.naver-userinfo-url",  naverUserinfoUrl,   false),
            rowResolved(db, "app.auth.social.default-site-id",     socialDefaultSiteId, false),
            // 토스
            rowResolved(db, "app.toss.confirm-url",     tossConfirmUrl,    false),
            rowResolved(db, "app.toss.cancel-url-base", tossCancelUrlBase, false),
            rowResolved(db, "app.toss.client-key",      tossClientKey,     false),
            rowResolved(db, "app.toss.secret-key",      tossSecretKey,     true),
            // 지도
            rowResolved(db, "app.map.kakao-js-key",        kakaoJsKey,       false),
            rowResolved(db, "app.map.naver-map-client-id", naverMapClientId, false),
            // 메일
            rowResolved(db, "spring.mail.host",     mailHost,     false),
            rowResolved(db, "spring.mail.port",     mailPort,     false),
            rowResolved(db, "spring.mail.username", mailUsername, false),
            rowResolved(db, "spring.mail.password", "",           true),
            rowResolved(db, "app.mail.from",        mailFrom,     false),
            rowResolved(db, "app.mail.from-nm",     mailFromNm,   false),
            // 카카오 알림톡
            rowResolved(db, "app.kakao.alimtalk.sender-key", kakaoAlimtalkSenderKey, true),
            // 파일 저장소
            rowResolved(db, "app.file.storage-type",    fileStorageType, false),
            rowResolved(db, "app.file.cdn-host",        fileCdnHost,     false),
            rowResolved(db, "app.file.aws.bucket-name", awsBucketName,  false),
            rowResolved(db, "app.file.aws.region",      awsRegion,       false),
            rowResolved(db, "app.file.aws.access-key",  awsAccessKey,    true),
            rowResolved(db, "app.file.aws.secret-key",  awsSecretKey,    true),
            rowResolved(db, "app.file.aws.cdn-url",     awsCdnUrl,       false),
            rowResolved(db, "app.file.ncp.bucket-name", ncpBucketName,  false),
            rowResolved(db, "app.file.ncp.endpoint",    ncpEndpoint,     false),
            rowResolved(db, "app.file.ncp.access-key",  ncpAccessKey,    true),
            rowResolved(db, "app.file.ncp.secret-key",  ncpSecretKey,    true),
            rowResolved(db, "app.file.ncp.cdn-url",     ncpCdnUrl,       false)
        )));
    }
}
