package com.shopjoy.ecadminapi.auth.controller;

import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.BoJoinRes;
import com.shopjoy.ecadminapi.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.auth.data.vo.RefreshReq;
import com.shopjoy.ecadminapi.auth.service.BoAuthService;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser; // @RequestBody 파라미터 타입
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BO 관리자 인증 API (sy_user)
 * GET  /api/auth/bo/auth/me      — 현재 사용자 정보 조회
 * POST /api/auth/bo/auth/login   — 로그인 (JWT 발급)
 * POST /api/auth/bo/auth/join    — 관리자 등록
 * POST /api/auth/bo/auth/refresh — 토큰 갱신
 * POST /api/auth/bo/auth/logout  — 로그아웃
 *
 * 인가: /me 는 인증 필수, 나머지는 permitAll
 */
@RestController
@RequestMapping("/api/auth/bo/auth")
@RequiredArgsConstructor
public class BoAuthController {

    private final BoAuthService authService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginRes>> getCurrentUser() {
        LoginRes result = authService.getCurrentUserInfo();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginRes>> login(@RequestBody @Valid LoginReq request) {
        LoginRes result = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<BoJoinRes>> join(@RequestBody SyUser body) {
        BoJoinRes result = authService.join(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenPair>> refresh(@RequestBody @Valid RefreshReq request) {
        TokenPair result = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody RefreshReq request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(null, "로그아웃 되었습니다."));
    }
}
