package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 상품권 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/pm/voucher/{id}/status
 */
public class PmVoucherChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;  // 변경할 상품권상태 — VOUCHER_STATUS_CD {ACTIVE:활성, USED:사용완료, EXPIRED:만료, CANCELLED:취소, INACTIVE:비활성}
    }
}
