package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

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
        @Size(max = 30) private String statusCd;
    }
}
