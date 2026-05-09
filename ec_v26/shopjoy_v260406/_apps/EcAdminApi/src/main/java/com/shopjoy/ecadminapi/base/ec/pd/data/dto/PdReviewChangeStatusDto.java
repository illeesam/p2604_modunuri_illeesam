package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 리뷰 상태 변경 Request DTO.
 * 사용: PATCH /api/bo/ec/pd/review/{id}/status
 */
public class PdReviewChangeStatusDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 30) private String reviewStatusCd;
    }
}
