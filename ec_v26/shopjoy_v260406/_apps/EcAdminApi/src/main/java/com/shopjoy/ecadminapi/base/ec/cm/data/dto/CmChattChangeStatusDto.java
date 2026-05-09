package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 채팅방 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/cm/chatt/{id}/status
 */
public class CmChattChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;
    }
}
