package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StReconDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;                // 사이트ID 필터
        @Size(max = 21) private String reconId;               // 대사ID 필터
        @Size(max = 20) private String reconTypeCd;           // 대사유형 필터 — RECON_TYPE_CD (ORDER/PAY/CLAIM/VENDOR)
        @Size(max = 20) private String reconStatusCd;         // 대사상태 필터 — RECON_STATUS_CD (MATCHED/MISMATCH/RESOLVED)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String reconId;                    // 대사ID (YYMMDDhhmmss+rand4)
        private String vendorId;                     // 업체ID
        private String reconTypeCd;                    // 대사유형 — RECON_TYPE_CD (ORDER/PAY/CLAIM/VENDOR)
        private String reconStatusCd;                    // 대사상태 — RECON_STATUS_CD (MATCHED/MISMATCH/RESOLVED)
        private String reconStatusCdBefore;                // 변경 전 대사상태
        private String settleId;                             // 정산ID (st_settle.settle_id)
        private String settleRawId;                            // 수집원장ID (st_settle_raw.settle_raw_id)
        private String refId;                                    // 참조ID (order_id / pay_id / claim_id 등)
        private String refNo;                                     // 참조번호 스냅샷
        private String settlePeriod;                                // 정산기간 (YYYY-MM)
        private Long expectedAmt;                                    // 기대금액 (정산 계산값)
        private Long actualAmt;                                       // 실제금액 (외부/결제 확인값)
        private Long diffAmt;                                          // 차이금액 (expected_amt - actual_amt)
        private String reconNote;                                      // 대사 메모
        private String resolvedBy;                                      // 해소 처리자 (sy_user.user_id)
        private LocalDateTime resolvedDate;                              // 해소 일시
        private String regBy;                                             // 등록자
        private LocalDateTime regDate;                                     // 등록일시
        private String regSiteId;                                          // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                                // 수정자
        private LocalDateTime updDate;                                       // 수정일시
    }

}
