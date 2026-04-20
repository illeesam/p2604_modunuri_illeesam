package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyRoleReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String roleId;
    private String siteId;
    private String roleCode;
    private String roleNm;
    private String parentRoleId;
    private String roleTypeCd;
    private Integer sortOrd;
    private String useYn;
    private String restrictPerm;
    private String roleRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    public SyRole toEntity() {
        return SyRole.builder()
                .roleId(roleId)
                .siteId(siteId)
                .roleCode(roleCode)
                .roleNm(roleNm)
                .parentRoleId(parentRoleId)
                .roleTypeCd(roleTypeCd)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .restrictPerm(restrictPerm)
                .roleRemark(roleRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .dispPath(dispPath)
                .build();
    }
}
