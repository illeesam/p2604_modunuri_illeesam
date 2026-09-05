package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 이벤트 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/pm/event/{id}/status
 */
public class PmEventChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String statusCd;  // 변경할 이벤트상태 — EVENT_STATUS_CD {PENDING:대기, ACTIVE:진행중, ENDED:종료, INACTIVE:비활성}
    }
}
