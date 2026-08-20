package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdDlivItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String dlivItemId;  // 배송항목ID 필터
        @Size(max = 21) private String dlivId;         // 상위 FK 필터
        private List<String> dlivIds;                  // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String dlivItemId;  // 배송항목ID (YYMMDDhhmmss+rand4)
        private String dlivId;  // 배송ID (od_dliv.)
        private String orderItemId;  // 주문상품ID (od_order_item.)
        private String prodId;  // 상품ID
        private String prodOpt1Id;  // 옵션1 값ID (pd_prod_opt.opt_id)
        private String prodOpt2Id;  // 옵션2 값ID (pd_prod_opt.opt_id)
        private String dlivTypeCd;  // 입출고구분 (OUT:출고 / IN:입고반품)
        private Long unitPrice;  // 단가 (주문시점 스냅샷)
        private Integer dlivQty;  // 출고수량 (부분출고 시 주문수량보다 적을 수 있음)
        private String dlivItemStatusCd;  // 항목 배송상태 — DLIV_STATUS {READY:준비중, SHIPPED:출고완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패}
        private String dlivItemStatusCdBefore;  // 변경 전 배송상태 — DLIV_STATUS
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
