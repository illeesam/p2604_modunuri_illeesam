package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 사은품 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/pm/gift/{id}/status
 */
public class PmGiftChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;  // 변경할 사은품상태 — GIFT_STATUS_CD {ACTIVE:활성, INACTIVE:비활성, ENDED:종료, SOLDOUT:품절}
    }
}
