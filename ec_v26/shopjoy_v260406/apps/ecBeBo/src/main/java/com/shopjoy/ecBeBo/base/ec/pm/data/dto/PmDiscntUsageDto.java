package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmDiscntUsageDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;        // 사이트ID
        @Size(max = 21) private String discntUsageId; // 할인사용ID 필터
        @Size(max = 21) private String orderId;       // 주문ID 필터 (od_order.order_id)
        @Size(max = 21) private String orderItemId;   // 주문상품ID 필터 (od_order_item.order_item_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String discntUsageId;   // 할인사용ID (YYMMDDhhmmss+rand4)
        private String discntId;        // 할인ID (pm_discnt.discnt_id)
        private String discntNm;        // 할인명 스냅샷
        private String memberId;        // 회원ID (mb_member.member_id)
        private String orderId;         // 주문ID (od_order.order_id)
        private String orderItemId;     // 주문상품ID (od_order_item.order_item_id, 상품별 할인 적용 시)
        private String prodId;          // 상품ID (pd_prod.prod_id, 할인 적용 상품)
        private String discntTypeCd;    // 할인유형 스냅샷 (RATE=정률 / FIXED=정액 / FREE_SHIP=무료배송)
        private BigDecimal discntValue; // 할인값 스냅샷 (정률이면 % / 정액이면 원)
        private Long discntAmt;         // 실할인금액
        private LocalDateTime usedDate; // 적용일시
        private String regBy;           // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;       // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
