package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmSaveUsageDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String saveUsageId;  // 적립사용ID (YYMMDDhhmmss+rand4)
        @Size(max = 21) private String orderId;  // 주문ID (od_order.order_id)
        @Size(max = 21) private String orderItemId;  // 주문상품ID (od_order_item.order_item_id, 상품별 사용 시)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveUsageId;  // 적립사용ID (YYMMDDhhmmss+rand4)
        private String memberId;  // 회원ID (mb_member.member_id)
        private String orderId;  // 주문ID (od_order.order_id)
        private String orderItemId;  // 주문상품ID (od_order_item.order_item_id, 상품별 사용 시)
        private String prodId;  // 상품ID (pd_prod.prod_id, 사용 상품)
        private Long useAmt;  // 사용 적립금액
        private Long balanceAmt;  // 사용 후 잔액
        private LocalDateTime usedDate;  // 사용일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
    }

}
