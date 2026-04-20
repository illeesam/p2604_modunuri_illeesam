package com.shopjoy.ecadminapi.auth.controller;

import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.auth.data.vo.RefreshReq;
import com.shopjoy.ecadminapi.auth.service.AuthService;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * BO 관리자 인증 API (sy_user)
 * POST /auth/bo/login   — 로그인 (JWT 발급)
 * POST /auth/bo/join    — 관리자 등록
 * POST /auth/bo/refresh — 토큰 갱신
 * POST /auth/bo/logout  — 로그아웃
 *
 * 인가: 전체 permitAll
 */
@RestController
@RequestMapping("/auth/bo")
@RequiredArgsConstructor
public class AuthBoController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginRes>> login(@RequestBody @Valid LoginReq request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<SyUser>> join(@RequestBody SyUser body) {
        return ResponseEntity.status(201).body(ApiResponse.created(authService.join(body)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenPair>> refresh(@RequestBody @Valid RefreshReq request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refresh(request.getRefreshToken())));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody RefreshReq request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(null, "로그아웃 되었습니다."));
    }
}
