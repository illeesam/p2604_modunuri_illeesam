package com.shopjoy.ecBeCdn.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CfTokenResponse {
    private String accessToken;
    private String refreshToken;
    /** accessToken 만료까지 남은 초. 고정 30초(app.cf.jwt.access-expiry-ms) — 호출측이 재발급 주기를 잡는 데 사용. */
    private long expiresIn;
}
