package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdhClaimItemStatusHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String claimItemStatusHistId;  // 클레임상품상태이력ID (YYMMDDhhmmss+rand4)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String claimItemStatusHistId;  // 클레임상품상태이력ID (YYMMDDhhmmss+rand4)
        private String claimItemId;  // 클레임상품ID (od_claim_item.claim_item_id)
        private String claimId;  // 클레임ID (od_claim.claim_id)
        private String orderItemId;  // 주문상품ID (od_order_item.order_item_id)
        private String claimItemStatusCdBefore;  // 변경 전 클레임상품상태 (코드: CLAIM_ITEM_STATUS)
        private String claimItemStatusCd;  // 변경 후 클레임상품상태 (코드: CLAIM_ITEM_STATUS)
        private String statusReason;  // 상태 변경 사유
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
