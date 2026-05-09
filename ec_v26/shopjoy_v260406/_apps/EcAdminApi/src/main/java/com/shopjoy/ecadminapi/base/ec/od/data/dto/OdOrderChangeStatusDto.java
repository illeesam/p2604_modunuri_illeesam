package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 주문 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/od/order/{id}/status
 */
public class OdOrderChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;
    }
}
