package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StSettlePayDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;                // 사이트ID 필터
        @Size(max = 21) private String settlePayId;           // 정산지급ID 필터
        @Size(max = 20) private String payStatusCd;           // 지급상태 필터 — SETTLE_PAY_STATUS (PENDING/COMPLT/FAILED)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settlePayId;              // 정산지급ID (YYMMDDhhmmss+rand4)
        private String settleId;                   // 정산ID (st_settle.settle_id)
        private String vendorId;                     // 업체ID (sy_vendor.vendor_id)
        private Long payAmt;                           // 지급금액
        private String payMethodCd;                      // 지급수단 — PAY_METHOD
        private String bankNm;                             // 은행명
        private String bankAccount;                          // 계좌번호
        private String bankHolder;                            // 예금주
        private String payStatusCd;                             // 지급상태 — SETTLE_PAY_STATUS (PENDING/COMPLT/FAILED)
        private String payStatusCdBefore;                         // 변경 전 상태
        private LocalDateTime payDate;                              // 실지급 일시
        private String payBy;                                        // 지급처리자 (sy_user.user_id)
        private String settlePayMemo;                                 // 메모
        private String regBy;                                          // 등록자
        private LocalDateTime regDate;                                  // 등록일시
        private String regSiteId;                                       // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                            // 수정자
        private LocalDateTime updDate;                                    // 수정일시
    }

}
