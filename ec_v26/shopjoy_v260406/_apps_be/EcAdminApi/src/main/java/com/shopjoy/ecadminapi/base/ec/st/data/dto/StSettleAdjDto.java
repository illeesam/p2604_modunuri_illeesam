package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StSettleAdjDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 21) private String settleAdjId;        // 정산조정ID 필터
        @Size(max = 20) private String adjTypeCd;          // 조정유형 필터 — ADJ_TYPE_CD (ADD/DEDUCT)
        @Size(max = 20) private String aprvStatusCd;       // 승인상태 필터 — APRV_STATUS_CD (대기/승인/반려)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleAdjId;              // 정산조정ID
        private String settleId;                   // 정산ID (st_settle.settle_id)
        private String adjTypeCd;                    // 조정유형 — ADJ_TYPE_CD (ADD/DEDUCT)
        private Long adjAmt;                           // 조정금액 (양수, 유형에 따라 가산/차감)
        private String adjReason;                       // 조정 사유
        private String settleAdjMemo;                     // 메모
        private String aprvStatusCd;                       // 승인상태 — APRV_STATUS_CD (대기/승인/반려)
        private String regBy;                               // 등록자
        private LocalDateTime regDate;                       // 등록일시
        private String regSiteId;                            // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                  // 수정자
        private LocalDateTime updDate;                         // 수정일시
    }

}
