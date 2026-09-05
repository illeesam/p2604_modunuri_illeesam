package com.shopjoy.ecBeCdn.auth.controller;

import com.shopjoy.ecBeCdn.auth.dto.CfLoginRequest;
import com.shopjoy.ecBeCdn.auth.dto.CfTokenResponse;
import com.shopjoy.ecBeCdn.auth.service.CfAuthService;
import com.shopjoy.ecBeCdn.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * id/pwd 로그인 → accessToken(30초) 발급. EcBeBo(호출측) 전용, 공개 permitAll.
 * refreshToken 은 응답에 절대 안 실린다(서버 cf_token 테이블에만 보관, 요청사항) — 재발급은
 * "지금 갖고 있는(막 만료됐을 수도 있는) accessToken" 을 Authorization 헤더로 보내는 방식이다
 * (EcBeBo 의 POST /api/co/bo-auth/token-refresh 와 동일 패턴).
 *
 * <p>X-Caller-System 헤더(선택) — 호출측이 자기 시스템 이름을 자기소개하는 용도(예:
 * "EcBeBo"). 마이크로서비스로 EcBeBo 가 여러 대일 때 IP만으론 "어느 서비스"인지
 * 모호할 수 있어(로드밸런서/NAT 뒤) cf_token/cf_token_hist 에 IP 와 별도로 기록한다.</p>
 */
@RestController
@RequestMapping("/api/cdn/auth")
@RequiredArgsConstructor
public class CfAuthController {

    private final CfAuthService cfAuthService;

    @PostMapping("/login")
    public ApiResponse<CfTokenResponse> login(
            @Valid @RequestBody CfLoginRequest body,
            @RequestHeader(value = "X-Caller-System", required = false) String callerSystem,
            HttpServletRequest request) {
        return ApiResponse.ok(cfAuthService.login(
            body.getId(), body.getPwd(), resolveClientIp(request), resolveCallerSystem(callerSystem)));
    }

    /** 재발급 — Authorization: Bearer {막 만료됐을 수도 있는 accessToken}. 요청 바디 없음. */
    @PostMapping("/refresh")
    public ApiResponse<CfTokenResponse> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Caller-System", required = false) String callerSystem,
            HttpServletRequest request) {
        String expiredAccessToken = (authHeader != null && authHeader.startsWith("Bearer "))
            ? authHeader.substring(7) : null;
        return ApiResponse.ok(cfAuthService.refresh(
            expiredAccessToken, resolveClientIp(request), resolveCallerSystem(callerSystem)));
    }

    /**
     * 호출자 IP 추출 — EcBeBo 가 여러 대(로드밸런서/리버스프록시 뒤)일 수 있다는 전제로,
     * X-Forwarded-For(프록시가 원 클라이언트 IP를 남길 때) 를 우선 보고 없으면 소켓 IP로 폴백.
     * EcBeBo.JwtAuthFilter.resolveClientIp() 와 동일한 패턴.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (!StringUtils.hasText(ip) || "unknown".equalsIgnoreCase(ip)) ip = request.getHeader("X-Real-IP");
        if (!StringUtils.hasText(ip) || "unknown".equalsIgnoreCase(ip)) ip = request.getRemoteAddr();
        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        return ip != null ? ip : "-";
    }

    private String resolveCallerSystem(String header) {
        return StringUtils.hasText(header) ? header : "UNKNOWN";
    }
}
