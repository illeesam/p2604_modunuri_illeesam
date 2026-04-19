package com.shopjoy.ecadminapi.auth;

import com.shopjoy.ecadminapi.auth.dto.LoginRequest;
import com.shopjoy.ecadminapi.auth.dto.LoginResponse;
import com.shopjoy.ecadminapi.auth.dto.RefreshRequest;
import com.shopjoy.ecadminapi.auth.dto.TokenPair;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/admin")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenPair>> refresh(@RequestBody @Valid RefreshRequest request) {
        TokenPair tokenPair = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(tokenPair));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody RefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(null, "로그아웃 되었습니다."));
    }
}
