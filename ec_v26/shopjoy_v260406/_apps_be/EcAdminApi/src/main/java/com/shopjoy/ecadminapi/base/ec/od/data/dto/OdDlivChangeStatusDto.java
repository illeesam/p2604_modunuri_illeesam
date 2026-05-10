package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 배송 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/od/dliv/{id}/status
 */
public class OdDlivChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;
    }
}
