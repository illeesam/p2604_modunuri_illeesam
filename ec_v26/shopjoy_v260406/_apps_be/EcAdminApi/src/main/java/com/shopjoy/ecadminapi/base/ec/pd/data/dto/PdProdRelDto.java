package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdRelDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;       // 사이트ID 필터
        @Size(max = 1) private String useYn;           // 사용여부 필터 Y/N
        @Size(max = 21) private String prodRelId;    // 연관관계ID 필터
        @Size(max = 21) private String prodId;       // 기준 상품ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodRelId;           // 연관관계ID (YYMMDDhhmmss+rand4)
        private String prodId;              // 기준 상품ID (pd_prod.prod_id)
        private String relProdId;           // 연관 대상 상품ID (pd_prod.prod_id)
        private String prodRelTypeCd;       // 관계유형 코드 (PROD_REL_TYPE: REL_PROD:연관상품/CODY_PROD:코디상품)
        private Integer sortOrd;            // 정렬순서 (낮을수록 우선 노출)
        private String useYn;               // 사용여부 Y/N
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
    }

}
