package com.shopjoy.ecadminapi.co.auth.data.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class TokenPair {
    private String accessToken;
    private String refreshToken;
    private LocalDateTime issuedAt;
    private long accessExpiresIn;
    private long refreshExpiresIn;
}
