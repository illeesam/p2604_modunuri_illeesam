package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyMenuReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String menuId;
    private String siteId;
    private String menuCode;
    private String menuNm;
    private String parentMenuId;
    private String menuUrl;
    private String menuTypeCd;
    private String iconClass;
    private Integer sortOrd;
    private String useYn;
    private String menuRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyMenu toEntity() {
        return SyMenu.builder()
                .menuId(menuId)
                .siteId(siteId)
                .menuCode(menuCode)
                .menuNm(menuNm)
                .parentMenuId(parentMenuId)
                .menuUrl(menuUrl)
                .menuTypeCd(menuTypeCd)
                .iconClass(iconClass)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .menuRemark(menuRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
