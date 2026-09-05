package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

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
        @Size(max = 30) private String statusCd;  // 변경할 할인상태 — DISCNT_STATUS_CD {ACTIVE:진행중, INACTIVE:비활성, EXPIRED:종료}
    }
}
