package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 할인 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/pm/discnt/{id}/status
 */
public class PmDiscntChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;
    }
}
