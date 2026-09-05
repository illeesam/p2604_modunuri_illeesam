package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmVoucherIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String voucherIssueId;  // 상품권발급ID
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String voucherIssueId;  // 상품권발급ID
        private String voucherId;  // 상품권ID (pm_voucher.voucher_id)
        private String memberId;  // 회원ID (mb_member.member_id)
        private String voucherCode;  // 발급 고유코드
        private LocalDateTime issueDate;  // 발급일시
        private LocalDateTime expireDate;  // 만료일시
        private LocalDateTime useDate;  // 사용일시
        private String orderId;  // 사용된 주문ID (od_order.order_id)
        private Long useAmt;  // 실제 사용 할인금액
        private String voucherIssueStatusCd;  // 상태 (코드: VOUCHER_ISSUE_STATUS)
        private String voucherIssueStatusCdNm;  // 코드 라벨
        private String voucherIssueStatusCdBefore;  // 변경 전 상태
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
