package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 쿠폰 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/pm/coupon/{id}/status
 */
public class PmCouponChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;  // 변경할 쿠폰상태 — COUPON_STATUS_CD {ACTIVE:활성, INACTIVE:비활성, EXPIRED:만료}
    }
}
