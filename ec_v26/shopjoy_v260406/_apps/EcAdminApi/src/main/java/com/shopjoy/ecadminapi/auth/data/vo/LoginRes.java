package com.shopjoy.ecadminapi.auth.data.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginRes {
    private String accessToken;
    private String refreshToken;
    private String userId;
    private String siteId;
    private String roleId;
    private String userTypeCd;
    private String vendorId;
}
