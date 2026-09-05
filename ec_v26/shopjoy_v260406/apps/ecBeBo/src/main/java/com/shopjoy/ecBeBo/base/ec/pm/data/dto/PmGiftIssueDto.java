package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmGiftIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;      // 사이트ID
        @Size(max = 21) private String giftIssueId; // 사은품발급ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String giftIssueId;          // 사은품발급ID
        private String giftId;               // 사은품ID (pm_gift.gift_id)
        private String memberId;             // 회원ID
        private String orderId;              // 기준주문ID (od_order.order_id)
        private LocalDateTime issueDate;     // 발급일시
        private String giftIssueStatusCd;    // 상태 — GIFT_ISSUE_STATUS_CD {ISSUED:발급됨, DELIVERED:배송완료, CANCELLED:취소, SHIPPED:발송, RECEIVED:수령}
        private String giftIssueStatusCdNm;  // 코드 라벨
        private String giftIssueStatusCdBefore; // 변경 전 상태
        private String giftIssueMemo;        // 메모
        private String regBy;                // 등록자
        private LocalDateTime regDate;       // 등록일
        private String regSiteId;            // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                // 수정자
        private LocalDateTime updDate;       // 수정일
    }

}
