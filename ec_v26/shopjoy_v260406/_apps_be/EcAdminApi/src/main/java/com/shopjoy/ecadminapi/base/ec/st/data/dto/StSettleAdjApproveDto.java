package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 정산조정 승인/반려 요청 DTO.
 * 사용: PUT /api/bo/ec/st/settle-adj/{id}/approve
 */
public class StSettleAdjApproveDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 승인/반려 상태 코드 (대기/승인/반려) */
        @Size(max = 30) private String aprvStatusCd;
        /** 승인/반려 사유 */
        @Size(max = 500) private String aprvReason;
    }
}
