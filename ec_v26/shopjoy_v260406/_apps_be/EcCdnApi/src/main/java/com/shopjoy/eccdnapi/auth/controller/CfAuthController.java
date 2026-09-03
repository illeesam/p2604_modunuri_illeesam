package com.shopjoy.eccdnapi.auth.controller;

import com.shopjoy.eccdnapi.auth.dto.CfLoginRequest;
import com.shopjoy.eccdnapi.auth.dto.CfRefreshRequest;
import com.shopjoy.eccdnapi.auth.dto.CfTokenResponse;
import com.shopjoy.eccdnapi.auth.service.CfAuthService;
import com.shopjoy.eccdnapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** id/pwd 로그인 → accessToken(30초)+refreshToken(7일). EcAdminApi(호출측) 전용, 공개 permitAll. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class CfAuthController {

    private final CfAuthService cfAuthService;

    @PostMapping("/login")
    public ApiResponse<CfTokenResponse> login(@Valid @RequestBody CfLoginRequest body) {
        return ApiResponse.ok(cfAuthService.login(body.getId(), body.getPwd()));
    }

    @PostMapping("/refresh")
    public ApiResponse<CfTokenResponse> refresh(@Valid @RequestBody CfRefreshRequest body) {
        return ApiResponse.ok(cfAuthService.refresh(body.getRefreshToken()));
    }
}
