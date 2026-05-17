package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class PdProdDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String prodId;
        private List<String> prodIds;                  // PK 다건 IN
        @Size(max = 21) private String brandId;
        @Size(max = 21) private String vendorId;
        @Size(max = 21) private String categoryId;
        @Size(max = 21) private String mdUserId;
        @Size(max = 30) private String prodTypeCd;
        @Size(max = 30) private String prodStatusCd;
        @Size(max = 1) private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodId;
        private String siteId;
        private String categoryId;
        private String brandId;
        private String vendorId;
        private String mdUserId;
        private String prodNm;
        private String prodTypeCd;
        private String prodCode;
        private Long listPrice;
        private Long salePrice;
        private Long purchasePrice;
        private BigDecimal marginRate;
        private BigDecimal platformFeeRate;
        private Long platformFeeAmount;
        private Integer prodStock;
        private String prodStatusCd;
        private String prodStatusCdBefore;
        private String thumbnailUrl;
        private String contentHtml;
        private BigDecimal weight;
        private String sizeInfoCd;
        private String isNew;
        private String isBest;
        private Integer viewCount;
        private Integer saleCount;
        private LocalDateTime saleStartDate;
        private LocalDateTime saleEndDate;
        private Integer minBuyQty;
        private Integer maxBuyQty;
        private Integer dayMaxBuyQty;
        private Integer idMaxBuyQty;
        private String adltYn;
        private String sameDayDlivYn;
        private String soldOutYn;
        private String dlivTmpltId;
        private String couponUseYn;
        private String saveUseYn;
        private String discntUseYn;
        private String advrtStmt;
        private LocalDateTime advrtStartDate;
        private LocalDateTime advrtEndDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String cateNm;
        private String parentCategoryId;
        private String brandNm;
        private String vendorNm;
        private String vendorTel;
        private String mdUserNm;
        private String prodStatusCdNm;
        private String prodTypeCdNm;
        private String sizeInfoCdNm;
        // ── Tier 1 상세 연관정보 (getDetail 시 채움) ──
        private List<PdProdImgDto.Item>     prodImgs;     // 상품 이미지 목록
        private List<PdProdOptDto.Item>     prodOpts;     // 옵션 그룹 목록
        private List<PdProdOptItemDto.Item> prodOptItems; // 옵션 아이템 목록
        private List<PdProdSkuDto.Item>     prodSkus;     // SKU 목록
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
