package com.shopjoy.ecadminapi.auth.data.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FoLoginRes {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String memberId;
    private String memberEmail;
    private String memberNm;
    private String siteId;
    private String roleId;
    private LocalDateTime loginAt;
    private long accessExpiresIn;
    private long refreshExpiresIn;
}
