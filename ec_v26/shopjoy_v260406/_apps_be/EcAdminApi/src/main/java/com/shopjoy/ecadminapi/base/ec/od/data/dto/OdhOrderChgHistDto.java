package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdhOrderChgHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String orderChgHistId;  // 이력ID
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderChgHistId;  // 이력ID
        private String orderId;  // 주문ID
        private String chgTypeCd;  // 변경유형코드 (PAY_METHOD/RECV_INFO/AMOUNT/MEMO/COUPON/CACHE/APPROVAL)
        private String chgField;  // 변경 필드명
        private String beforeVal;  // 변경전값
        private String afterVal;  // 변경후값
        private String chgReason;  // 변경사유
        private String chgUserId;  // 처리자 (sy_user.user_id)
        private LocalDateTime chgDate;  // 처리일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
