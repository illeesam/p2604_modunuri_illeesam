package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdProdSkuDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 1) private String useYn;  // 사용여부 필터 Y/N
        @Size(max = 21) private String prodSkuId;  // SKU ID (단건 조회 필터)
        @Size(max = 21) private String prodId;  // 상품ID 필터
        private List<String> prodIds;                  // PK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodSkuId;  // SKU ID
        private String prodId;  // 상품ID
        private String prodOpt1Id;  // 옵션1 값ID (pd_prod_opt.prod_opt_id)
        private String prodOpt2Id;  // 옵션2 값ID (pd_prod_opt.prod_opt_id)
        private String prodSkuCode;  // 자체 SKU 코드
        private Long addPrice;  // 옵션 추가금액 (기본가 대비)
        private Integer stock;  // 재고수량 (pd_prod_sku 조인/집계값, Entity에는 없음)
        private String useYn;  // 사용여부 Y/N
        private Integer sortNo;  // 정렬순서
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String prodOptNm1;  // 옵션1 표시명 (조인 조회값)
        private String prodOptNm2;  // 옵션2 표시명 (조인 조회값)
    }

}
