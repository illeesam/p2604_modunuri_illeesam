package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * ERP 전표 생성 요청 DTO.
 * 사용: POST /api/bo/ec/st/erp/gen
 */
public class StErpVoucherGenDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 정산 대상 월 (yyyyMM) */
        @Size(max = 6) private String targetMon;   // 정산 대상 월 (yyyyMM)
        /** 전표 유형 코드 */
        @Size(max = 30) private String slipType;   // 전표 유형 코드 — ERP_VOUCHER_TYPE_CD (SETTLE/RETURN/ADJ/PAY)
    }
}
