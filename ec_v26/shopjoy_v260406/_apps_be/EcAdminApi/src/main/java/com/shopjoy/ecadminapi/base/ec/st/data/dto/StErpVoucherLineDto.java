package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StErpVoucherLineDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String erpVoucherLineId;   // 전표라인ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String erpVoucherLineId;         // 전표라인ID (YYMMDDhhmmss+rand4)
        private String erpVoucherId;               // ERP전표ID (st_erp_voucher.erp_voucher_id)
        private Integer lineNo;                      // 라인 순번 (전표 내 고유)
        private String accountCd;                      // 계정코드 (ERP 계정과목 코드)
        private String accountNm;                        // 계정명 스냅샷
        private String costCenterCd;                       // 코스트센터 코드
        private String profitCenterCd;                       // 수익센터 코드
        private Long debitAmt;                                // 차변 금액 (대변과 상호 배타적)
        private Long creditAmt;                                // 대변 금액 (차변과 상호 배타적)
        private String refTypeCd;                               // 참조유형 (SETTLE/ORDER/CLAIM/PAY/ADJ)
        private String refId;                                    // 참조ID (settle_id / order_id / claim_id 등)
        private String lineMemo;                                  // 라인 적요
        private String regBy;                                      // 등록자
        private LocalDateTime regDate;                              // 등록일시
        private String regSiteId;                                   // 등록 사이트ID
    }

}
