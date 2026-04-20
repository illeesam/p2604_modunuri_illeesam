package com.shopjoy.ecadminapi.auth.controller;

import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.FoJoinRes;
import com.shopjoy.ecadminapi.auth.data.vo.FoLoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.FoLoginRes;
import com.shopjoy.ecadminapi.auth.data.vo.RefreshReq;
import com.shopjoy.ecadminapi.auth.service.FoAuthService;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * FO 회원 인증 API (ec_member)
 * POST /auth/fo/login   — 로그인 (JWT 발급)
 * POST /auth/fo/join    — 회원가입
 * POST /auth/fo/refresh — 토큰 갱신
 * POST /auth/fo/logout  — 로그아웃
 *
 * 인가: 전체 permitAll
 */
@RestController
@RequestMapping("/auth/fo")
@RequiredArgsConstructor
public class FoAuthController {

    private final FoAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<FoLoginRes>> login(@RequestBody @Valid FoLoginReq request) {
        FoLoginRes result = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<FoJoinRes>> join(@RequestBody MbMember body) {
        FoJoinRes result = authService.join(body);
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
