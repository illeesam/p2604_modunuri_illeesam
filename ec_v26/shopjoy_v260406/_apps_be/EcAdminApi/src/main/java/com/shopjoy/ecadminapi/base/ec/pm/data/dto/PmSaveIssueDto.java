package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmSaveIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String saveIssueId;  // 적립지급ID (YYMMDDhhmmss+rand4)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveIssueId;  // 적립지급ID (YYMMDDhhmmss+rand4)
        private String memberId;  // 회원ID (mb_member.member_id)
        private String saveIssueTypeCd;  // 지급유형 (코드: SAVE_ISSUE_TYPE — ORDER/EVENT/REVIEW/REFERRAL/ADMIN)
        private Long saveAmt;  // 지급 적립금액
        private BigDecimal saveRate;  // 적립률 (%, 구매적립 시)
        private String refTypeCd;  // 참조유형 (ORDER/EVENT/REVIEW/ADMIN)
        private String refId;  // 참조ID (order_id / event_id 등)
        private String orderId;  // 주문ID (od_order.order_id, 구매적립 시)
        private String orderItemId;  // 주문상품ID (od_order_item.order_item_id, 상품별 적립 시)
        private String prodId;  // 상품ID (pd_prod.prod_id, 적립 기준 상품)
        private LocalDateTime expireDate;  // 소멸예정일
        private String issueStatusCd;  // 지급상태 (코드: SAVE_ISSUE_STATUS — PENDING/CONFIRMED/EXPIRED/CANCELED)
        private String issueStatusCdBefore;  // 변경 전 지급상태
        private String saveMemo;  // 지급 메모
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
