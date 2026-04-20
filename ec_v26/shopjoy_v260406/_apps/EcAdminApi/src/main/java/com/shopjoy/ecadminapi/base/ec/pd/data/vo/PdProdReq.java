package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PdProdReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public PdProd toEntity() {
        return PdProd.builder()
                .prodId(prodId)
                .siteId(siteId)
                .categoryId(categoryId)
                .brandId(brandId)
                .vendorId(vendorId)
                .mdUserId(mdUserId)
                .prodNm(prodNm)
                .prodTypeCd(prodTypeCd)
                .prodCode(prodCode)
                .listPrice(listPrice)
                .salePrice(salePrice)
                .purchasePrice(purchasePrice)
                .marginRate(marginRate)
                .prodStock(prodStock)
                .prodStatusCd(prodStatusCd)
                .prodStatusCdBefore(prodStatusCdBefore)
                .thumbnailUrl(thumbnailUrl)
                .contentHtml(contentHtml)
                .weight(weight)
                .sizeInfoCd(sizeInfoCd)
                .isNew(isNew)
                .isBest(isBest)
                .viewCount(viewCount)
                .saleCount(saleCount)
                .saleStartDate(saleStartDate)
                .saleEndDate(saleEndDate)
                .minBuyQty(minBuyQty)
                .maxBuyQty(maxBuyQty)
                .dayMaxBuyQty(dayMaxBuyQty)
                .idMaxBuyQty(idMaxBuyQty)
                .adltYn(adltYn)
                .sameDayDlivYn(sameDayDlivYn)
                .soldOutYn(soldOutYn)
                .dlivTmpltId(dlivTmpltId)
                .couponUseYn(couponUseYn)
                .saveUseYn(saveUseYn)
                .discntUseYn(discntUseYn)
                .advrtStmt(advrtStmt)
                .advrtStartDate(advrtStartDate)
                .advrtEndDate(advrtEndDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
