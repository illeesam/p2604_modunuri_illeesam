package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdCategoryProdReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String categoryProdId;
    private String siteId;
    private String categoryId;
    private String prodId;
    private String categoryProdTypeCd;
    private Integer sortOrd;
    private String emphasisCd;
    private String dispYn;
    private LocalDate dispStartDate;
    private LocalDate dispEndDate;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PdCategoryProd toEntity() {
        return PdCategoryProd.builder()
                .categoryProdId(categoryProdId)
                .siteId(siteId)
                .categoryId(categoryId)
                .prodId(prodId)
                .categoryProdTypeCd(categoryProdTypeCd)
                .sortOrd(sortOrd)
                .emphasisCd(emphasisCd)
                .dispYn(dispYn)
                .dispStartDate(dispStartDate)
                .dispEndDate(dispEndDate)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
