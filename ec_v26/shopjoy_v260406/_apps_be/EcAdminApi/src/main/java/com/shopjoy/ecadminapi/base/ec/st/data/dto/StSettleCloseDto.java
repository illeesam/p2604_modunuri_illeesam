package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StSettleCloseDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;              // 사이트ID 필터
        @Size(max = 21) private String settleCloseId;       // 마감이력ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleCloseId;             // 마감이력ID
        private String settleId;                    // 정산ID (st_settle.settle_id)
        private String closeStatusCd;                // 마감상태 — CLOSE_STATUS_CD (CLOSED/REOPENED)
        private String closeReason;                    // 마감/재오픈 사유
        private Long finalSettleAmt;                     // 마감 시점 최종정산금액 스냅샷
        private String closeBy;                            // 처리자 (sy_user.user_id)
        private LocalDateTime closeDate;                    // 처리일시
        private String regBy;                                // 등록자
        private LocalDateTime regDate;                        // 등록일시
        private String regSiteId;                              // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
