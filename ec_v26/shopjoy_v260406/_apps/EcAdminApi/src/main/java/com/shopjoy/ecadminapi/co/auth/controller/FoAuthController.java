package com.shopjoy.ecadminapi.co.auth.controller;

import com.shopjoy.ecadminapi.co.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.co.auth.data.vo.FoJoinRes;
import com.shopjoy.ecadminapi.co.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.co.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.co.auth.service.FoAuthService;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * FO 회원 인증 API (ec_member)
 * POST /api/co/fo-auth/login   — 로그인 (멀티디바이스 허용)
 * POST /api/co/fo-auth/join    — 회원가입
 * POST /api/co/fo-auth/refresh — 토큰 갱신 (Authorization 헤더로 만료된 accessToken 전달, refreshToken은 서버 DB 조회)
 * POST /api/co/fo-auth/logout  — 로그아웃
 */
@RestController
@RequestMapping("/api/co/fo-auth")
@RequiredArgsConstructor
public class FoAuthController {

    private final FoAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginRes>> login(@RequestBody @Valid LoginReq request) {
        LoginRes result = authService.login(request, "FO");
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<FoJoinRes>> join(@RequestBody MbMember body) {
        FoJoinRes result = authService.join(body, "FO");
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /**
     * 토큰 갱신 — 만료된 accessToken을 Authorization 헤더로 전달
     * refreshToken은 서버 mbh_member_token_log에서 조회 (클라이언트 미전달)
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenPair>> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String expiredAccessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        TokenPair result = authService.refresh(expiredAccessToken, "FO");
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        authService.logout(accessToken, "FO");
        return ResponseEntity.ok(ApiResponse.ok(null, "로그아웃 되었습니다."));
    }
}
