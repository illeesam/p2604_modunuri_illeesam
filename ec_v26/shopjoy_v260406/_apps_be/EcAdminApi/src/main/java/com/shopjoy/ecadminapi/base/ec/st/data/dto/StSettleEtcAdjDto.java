package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StSettleEtcAdjDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;                 // 사이트ID 필터
        @Size(max = 21) private String settleEtcAdjId;         // 기타조정ID 필터
        @Size(max = 20) private String etcAdjTypeCd;           // 기타조정유형 필터 — ETC_ADJ_TYPE_CD (SHIP/RETURN_SHIP/PENALTY/OTHER)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleEtcAdjId;             // 기타조정ID
        private String settleId;                     // 정산ID (st_settle.settle_id)
        private String etcAdjTypeCd;                   // 기타조정유형 — ETC_ADJ_TYPE_CD (SHIP/RETURN_SHIP/PENALTY/OTHER)
        private String etcAdjDirCd;                     // 가산/차감 — ETC_ADJ_DIR_CD (ADD/DEDUCT)
        private Long etcAdjAmt;                           // 기타조정 금액
        private String etcAdjReason;                       // 사유
        private String settleEtcAdjMemo;                     // 메모
        private String regBy;                                 // 등록자
        private LocalDateTime regDate;                         // 등록일시
        private String regSiteId;                              // 등록 사이트ID
        private String updBy;                                    // 수정자
        private LocalDateTime updDate;                           // 수정일시
    }

}
