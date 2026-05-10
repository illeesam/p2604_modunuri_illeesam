package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 상품 Q&A 답변 저장 Request DTO.
 * 사용: PUT /api/bo/ec/pd/qna/{id}/answer
 */
public class PdProdQnaAnswerDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 4000) private String answContent;
    }
}
