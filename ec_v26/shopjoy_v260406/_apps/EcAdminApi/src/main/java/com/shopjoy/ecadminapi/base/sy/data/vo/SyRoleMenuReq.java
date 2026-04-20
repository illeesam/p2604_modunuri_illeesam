package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyRoleMenuReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String roleMenuId;
    private String siteId;
    private String roleId;
    private String menuId;
    private Integer permLevel;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyRoleMenu toEntity() {
        return SyRoleMenu.builder()
                .roleMenuId(roleMenuId)
                .siteId(siteId)
                .roleId(roleId)
                .menuId(menuId)
                .permLevel(permLevel)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
