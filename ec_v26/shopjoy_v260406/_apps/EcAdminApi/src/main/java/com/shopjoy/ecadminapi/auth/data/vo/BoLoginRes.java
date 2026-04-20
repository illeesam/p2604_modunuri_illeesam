package com.shopjoy.ecadminapi.auth.data.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BoLoginRes {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String userId;
    private String loginId;
    private String userNm;
    private String userEmail;
    private String siteId;
    private String roleId;
    private LocalDateTime loginAt;
    private long accessExpiresIn;
    private long refreshExpiresIn;
}
