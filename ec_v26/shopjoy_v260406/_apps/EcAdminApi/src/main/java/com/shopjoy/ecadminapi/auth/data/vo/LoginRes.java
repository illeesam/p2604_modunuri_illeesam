package com.shopjoy.ecadminapi.auth.data.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginRes {
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
