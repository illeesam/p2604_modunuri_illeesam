package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class StErpVoucherDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;                    // 사이트ID 필터
        @Size(max = 21) private String erpVoucherId;              // ERP전표ID 필터
        @Size(max = 20) private String erpVoucherTypeCd;          // 전표유형 필터 — ERP_VOUCHER_TYPE_CD (SETTLE/RETURN/ADJ/PAY)
        @Size(max = 20) private String erpVoucherStatusCd;        // 전표상태 필터 — ERP_VOUCHER_STATUS_CD (DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String erpVoucherId;                 // ERP전표ID (YYMMDDhhmmss+rand4)
        private String vendorId;                       // 업체ID
        private String settleId;                        // 정산ID (st_settle.settle_id)
        private String settleYm;                         // 정산년월 (YYYYMM)
        private String erpVoucherTypeCd;                  // 전표유형 — ERP_VOUCHER_TYPE_CD (SETTLE/RETURN/ADJ/PAY)
        private String erpVoucherStatusCd;                 // 전표상태 — ERP_VOUCHER_STATUS_CD (DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)
        private String erpVoucherStatusCdBefore;            // 변경 전 전표상태
        private LocalDate voucherDate;                       // 전표 기준일자
        private String erpVoucherDesc;                        // 전표 적요
        private Long totalDebitAmt;                            // 차변 합계 (대변과 일치해야 전표 확정 가능)
        private Long totalCreditAmt;                            // 대변 합계
        private LocalDateTime erpSendDate;                       // ERP 전송일시
        private String erpVoucherNo;                              // ERP 채번 전표번호 (전송 후 ERP에서 수신)
        private String erpResMsg;                                  // ERP 처리 응답 메시지
        private String regBy;                                       // 등록자
        private LocalDateTime regDate;                               // 등록일시
        private String regSiteId;                                    // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                          // 수정자
        private LocalDateTime updDate;                                 // 수정일시
    }

}
