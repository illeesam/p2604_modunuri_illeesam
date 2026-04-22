package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 인증 정보 VO
 * - JWT 토큰 정보
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreAuth {
    private String accessToken;
    private String refreshToken;
    private Long accessExpiresIn;      // 초 단위
    private Long refreshExpiresIn;     // 초 단위
}
