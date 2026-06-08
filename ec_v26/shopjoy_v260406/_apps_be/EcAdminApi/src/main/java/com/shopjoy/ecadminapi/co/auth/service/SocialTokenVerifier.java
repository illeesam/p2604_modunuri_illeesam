package com.shopjoy.ecadminapi.co.auth.service;

import com.shopjoy.ecadminapi.co.auth.data.dto.SocialUserInfo;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * 소셜 제공자 accessToken 검증기.
 *
 * <p>클라이언트가 보낸 provider accessToken을 각 제공자의 userinfo 엔드포인트로 호출하여
 * 토큰 유효성을 검증하고 실제 SNS 사용자ID/프로필을 정규화하여 반환한다.</p>
 *
 * <p>지원 provider: google / kakao / naver. userinfo URL은 설정값(auth.social.*-userinfo-url)
 * 으로 외부화하고, 미설정 시 각 제공자 공식 기본값을 사용한다.</p>
 *
 * <p>HTTP 클라이언트: Spring RestClient (spring-web 동봉, 별도 의존성 불필요).
 * 검증 실패(만료/위조/네트워크 오류 등)는 CmBizException(401)로 변환한다.</p>
 */
@Slf4j
@Component
public class SocialTokenVerifier {

    private final RestClient restClient;
    private final String googleUserinfoUrl;
    private final String kakaoUserinfoUrl;
    private final String naverUserinfoUrl;

    public SocialTokenVerifier(
            @Value("${auth.social.google-userinfo-url:https://www.googleapis.com/oauth2/v3/userinfo}") String googleUserinfoUrl,
            @Value("${auth.social.kakao-userinfo-url:https://kapi.kakao.com/v2/user/me}") String kakaoUserinfoUrl,
            @Value("${auth.social.naver-userinfo-url:https://openapi.naver.com/v1/nid/me}") String naverUserinfoUrl) {
        this.restClient = RestClient.create();
        this.googleUserinfoUrl = googleUserinfoUrl;
        this.kakaoUserinfoUrl = kakaoUserinfoUrl;
        this.naverUserinfoUrl = naverUserinfoUrl;
    }

    /**
     * provider별 accessToken을 userinfo로 검증하여 정규화된 사용자정보를 반환한다.
     *
     * @param provider    소셜 제공자 (google/kakao/naver, 대소문자 무시)
     * @param accessToken 클라이언트가 제공자 SDK로 발급받은 accessToken
     * @return 검증된 SocialUserInfo (snsChannelCd/snsUserId 필수, 프로필은 동의 범위에 따라 null 가능)
     */
    public SocialUserInfo verify(String provider, String accessToken) {
        if (provider == null || provider.isBlank()) {
            throw new CmBizException("소셜 제공자(provider)가 비어 있습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        String p = provider.trim().toLowerCase();
        switch (p) {
            case "google": return verifyGoogle(accessToken);
            case "kakao":  return verifyKakao(accessToken);
            case "naver":  return verifyNaver(accessToken);
            default:
                throw new CmBizException("지원하지 않는 소셜 제공자입니다: " + provider + "::" + CmUtil.svcCallerInfo(this));
        }
    }

    // ── google ────────────────────────────────────────────────────────────

    /* verifyGoogle — Google OAuth2 userinfo (OpenID Connect) */
    private SocialUserInfo verifyGoogle(String accessToken) {
        Map<String, Object> body = callUserinfo("google", googleUserinfoUrl, accessToken);
        // 응답 예: { "sub": "1234...", "email": "...", "name": "...", ... }
        String sub = asStr(body.get("sub"));
        if (sub == null || sub.isBlank()) {
            throw new CmBizException("구글 사용자ID(sub)를 확인할 수 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        return SocialUserInfo.builder()
            .snsChannelCd("GOOGLE")
            .snsUserId(sub)
            .email(asStr(body.get("email")))
            .name(asStr(body.get("name")))
            .phone(null)
            .build();
    }

    // ── kakao ─────────────────────────────────────────────────────────────

    /* verifyKakao — Kakao /v2/user/me */
    @SuppressWarnings("unchecked")
    private SocialUserInfo verifyKakao(String accessToken) {
        Map<String, Object> body = callUserinfo("kakao", kakaoUserinfoUrl, accessToken);
        // 응답 예: { "id": 12345, "kakao_account": { "email": "...", "profile": { "nickname": "..." }, ... } }
        Object idObj = body.get("id");
        String id = idObj == null ? null : String.valueOf(idObj);
        if (id == null || id.isBlank()) {
            throw new CmBizException("카카오 사용자ID(id)를 확인할 수 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        String email = null;
        String name  = null;
        Object accObj = body.get("kakao_account");
        if (accObj instanceof Map<?, ?> account) {
            Map<String, Object> acc = (Map<String, Object>) account;
            email = asStr(acc.get("email"));
            Object profObj = acc.get("profile");
            if (profObj instanceof Map<?, ?> profile) {
                name = asStr(((Map<String, Object>) profile).get("nickname"));
            }
        }
        return SocialUserInfo.builder()
            .snsChannelCd("KAKAO")
            .snsUserId(id)
            .email(email)
            .name(name)
            .phone(null)
            .build();
    }

    // ── naver ─────────────────────────────────────────────────────────────

    /* verifyNaver — Naver /v1/nid/me */
    @SuppressWarnings("unchecked")
    private SocialUserInfo verifyNaver(String accessToken) {
        Map<String, Object> body = callUserinfo("naver", naverUserinfoUrl, accessToken);
        // 응답 예: { "resultcode": "00", "message": "success",
        //           "response": { "id": "...", "email": "...", "name": "...", "mobile": "..." } }
        Object respObj = body.get("response");
        if (!(respObj instanceof Map<?, ?> responseMap)) {
            throw new CmBizException("네이버 사용자정보(response)를 확인할 수 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        Map<String, Object> response = (Map<String, Object>) responseMap;
        String id = asStr(response.get("id"));
        if (id == null || id.isBlank()) {
            throw new CmBizException("네이버 사용자ID(id)를 확인할 수 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        return SocialUserInfo.builder()
            .snsChannelCd("NAVER")
            .snsUserId(id)
            .email(asStr(response.get("email")))
            .name(asStr(response.get("name")))
            .phone(asStr(response.get("mobile")))
            .build();
    }

    // ── private ───────────────────────────────────────────────────────────

    /** userinfo 엔드포인트 호출 (Bearer accessToken). 실패 시 CmBizException(401). */
    @SuppressWarnings("unchecked")
    private Map<String, Object> callUserinfo(String provider, String url, String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new CmBizException("소셜 accessToken이 비어 있습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        try {
            Map<String, Object> body = restClient.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);
            if (body == null || body.isEmpty()) {
                throw new CmBizException(provider + " 토큰 검증 응답이 비어 있습니다." + "::" + CmUtil.svcCallerInfo(this));
            }
            return body;
        } catch (CmBizException e) {
            throw e;
        } catch (Exception e) {
            log.warn("social token verify failed: provider={}, err={}", provider, e.getMessage());
            throw new CmBizException(provider + " 소셜 토큰 검증에 실패했습니다. 토큰이 만료되었거나 유효하지 않습니다." + "::" + CmUtil.svcCallerInfo(this),
                org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
    }

    /** Object를 String으로 안전 변환 (null 유지). */
    private String asStr(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
