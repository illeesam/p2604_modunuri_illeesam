package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdhPayChgHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String payChgHistId;  // 결제변경이력ID (YYMMDDhhmmss+rand4)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String payChgHistId;  // 결제변경이력ID (YYMMDDhhmmss+rand4)
        private String payId;  // 결제ID (od_pay.)
        private String orderId;  // 주문ID (od_order.)
        private String payStatusCdBefore;  // 변경 전 결제상태 (코드: PAY_STATUS)
        private String payStatusCdAfter;  // 변경 후 결제상태 (코드: PAY_STATUS)
        private String chgTypeCd;  // 변경유형 (코드: PAYMENT_CHG_TYPE)
        private String chgReason;  // 변경 사유 (예: PG 승인 완료, 수동 환불 등)
        private String pgResponse;  // PG 응답 데이터 (JSON)
        private Long refundAmt;  // 환불 금액 (환불 시만)
        private String refundPgTid;  // 환불 거래ID (환불 시 PG로부터 받은 ID)
        private String chgUserId;  // 변경 담당자 (sy_user.user_id, mb_member.member_id)
        private LocalDateTime chgDate;  // 변경 일시
        private String memo;  // 메모
        private String regBy;  // 등록자 (sy_user.user_id, mb_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자 (sy_user.user_id, mb_member.member_id)
        private LocalDateTime updDate;  // 수정일
    }

}
