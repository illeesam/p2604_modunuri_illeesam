package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 정산 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/st/settle/{id}/status
 */
public class StSettleChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;
    }
}
