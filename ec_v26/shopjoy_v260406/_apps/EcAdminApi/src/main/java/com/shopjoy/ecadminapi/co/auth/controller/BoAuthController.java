package com.shopjoy.ecadminapi.co.auth.controller;

import com.shopjoy.ecadminapi.co.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.co.auth.data.vo.BoJoinRes;
import com.shopjoy.ecadminapi.co.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.co.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.co.auth.service.BoAuthService;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BO 관리자 인증 API (sy_user)
 * POST /api/co/bo-auth/login   — 로그인 (1세션: 기존 토큰 자동 무효화)
 * POST /api/co/bo-auth/join    — 관리자 등록
 * POST /api/co/bo-auth/refresh — 토큰 갱신 (Authorization 헤더로 만료된 accessToken 전달, refreshToken은 서버 DB 조회)
 * POST /api/co/bo-auth/logout  — 로그아웃
 */
@RestController
@RequestMapping("/api/co/bo-auth")
@RequiredArgsConstructor
public class BoAuthController {

    private final BoAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginRes>> login(@RequestBody @Valid LoginReq request) {
        LoginRes result = authService.login(request, "BO");
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<BoJoinRes>> join(@RequestBody SyUser body) {
        BoJoinRes result = authService.join(body, "BO");
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /**
     * 토큰 갱신 — 만료된 accessToken을 Authorization 헤더로 전달
     * refreshToken은 서버 syh_user_token_log에서 조회 (클라이언트 미전달)
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenPair>> refresh(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String expiredAccessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        TokenPair result = authService.refresh(expiredAccessToken, "BO");
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        authService.logout(accessToken, "BO");
        return ResponseEntity.ok(ApiResponse.ok(null, "로그아웃 되었습니다."));
    }
}
