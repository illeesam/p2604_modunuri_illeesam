package com.shopjoy.ecadminapi.auth.controller;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.fo.ec.service.FoCmLoginService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
public class AuthFoController {

    private final FoCmLoginService loginService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(
                loginService.login(body.get("memberEmail"), body.get("memberPassword"))));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Map<String, Object>>> join(@RequestBody MbMember body) {
        return ResponseEntity.status(201).body(ApiResponse.created(loginService.join(body)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(loginService.refresh(body.get("refreshToken"))));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody Map<String, String> body) {
        loginService.logout(body.get("refreshToken"));
        return ResponseEntity.ok(ApiResponse.ok(null, "로그아웃 되었습니다."));
    }
}
