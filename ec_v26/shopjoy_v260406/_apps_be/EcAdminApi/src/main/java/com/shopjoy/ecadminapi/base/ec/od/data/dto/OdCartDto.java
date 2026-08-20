package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdCartDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String cartId;  // 장바구니ID 필터
        @Size(max = 21)  private String memberId;  // 회원ID 필터
        @Size(max = 200) private String memberNm;  // 회원명 LIKE 필터 (직접 입력 시)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String cartId;  // 장바구니ID (YYMMDDhhmmss+rand4)
        private String memberId;  // 회원ID (비회원 NULL)
        private String sessionKey;  // 비회원 세션키
        private String prodId;  // 상품ID (pd_prod.prod_id)
        private String prodSkuId;  // SKU ID (pd_prod_sku.prod_sku_id)
        private String prodOpt1Id;  // 옵션1 값ID (pd_prod_opt.opt_id, 예: 색상)
        private String prodOpt2Id;  // 옵션2 값ID (pd_prod_opt.opt_id, 예: 사이즈)
        private Long unitPrice;  // 단가 (담을 시점 가격)
        private Integer orderQty;  // 수량
        private Long itemPrice;  // 소계 (단가 × 수량)
        private String isChecked;  // 주문선택여부 Y/N
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String siteNm;  // 사이트명 (조인 표시용)
        private String memberNm;  // 회원명 (조인 표시용)
        private String prodNm;  // 상품명 (조인 표시용)
        private String prodOptNm1;  // 옵션1명 (조인 표시용, 예: 색상)
        private String prodOptNm2;  // 옵션2명 (조인 표시용, 예: 사이즈)
        // ── 연관정보 (목록 시 채움) ──
        private PdProdDto.Item    prod;   // 상품 단건
        private PdProdSkuDto.Item sku;    // SKU 단건
    }

}
