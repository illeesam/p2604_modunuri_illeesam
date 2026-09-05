package com.shopjoy.ecBeBo.base.ec.pd.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdQnaDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;       // 사이트ID 필터
        @Size(max = 1) private String useYn;           // 사용여부 필터 Y/N
        @Size(max = 21) private String prodQnaId;    // 문의ID 필터
        @Size(max = 21) private String prodId;       // 상품ID 필터
        @Size(max = 1) private String answYn;          // 답변여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodQnaId;           // 문의ID (YYMMDDhhmmss+rand4)
        private String prodId;              // 상품ID (pd_prod.prod_id)
        private String prodSkuId;           // SKUID (pd_prod_sku.prod_sku_id)
        private String memberId;            // 회원ID (mb_member.member_id)
        private String orderId;             // 주문ID (od_order.order_id)
        private String prodQnaTypeCd;       // 문의유형코드 — PROD_QNA_TYPE_CD {PROD:상품문의}
        private String prodQnaTitle;        // 문의제목
        private String prodQnaContent;      // 문의내용
        private String scrtYn;              // 비밀글여부 Y/N
        private String answYn;              // 답변여부 Y/N
        private String answContent;         // 답변내용
        private LocalDateTime answDate;     // 답변일시
        private String answUserId;          // 답변자ID (sy_user.user_id)
        private String dispYn;              // 노출여부 Y/N
        private String useYn;               // 사용여부 Y/N
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
    }

}
