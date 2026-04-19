package com.shopjoy.ecadminapi.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;      // seconds
    private String userId;
    private String loginId;
    private String userNm;
    private String userEmail;
    private String siteId;
    private String roleId;
}
