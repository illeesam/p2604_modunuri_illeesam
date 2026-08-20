package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdhProdSkuChgHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String histId;  // 이력ID (단건 조회 필터)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String histId;  // 이력ID (YYMMDDhhmmss+rand4)
        private String prodSkuId;  // SKU ID (pd_prod_sku.prod_sku_id)
        private String prodId;  // 상품ID (pd_prod.prod_id)
        private String chgTypeCd;  // 변경유형 — SKU_CHG_TYPE {STATUS:상태변경}
        private String beforeVal;  // 변경 전 값
        private String afterVal;  // 변경 후 값
        private String chgReason;  // 변경사유
        private String chgBy;  // 처리자 (sy_user.user_id)
        private LocalDateTime chgDate;  // 처리일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
