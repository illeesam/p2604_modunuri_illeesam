package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyDeptReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String deptId;
    private String siteId;
    private String deptCode;
    private String deptNm;
    private String parentDeptId;
    private String deptTypeCd;
    private String managerId;
    private Integer sortOrd;
    private String useYn;
    private String deptRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyDept toEntity() {
        return SyDept.builder()
                .deptId(deptId)
                .siteId(siteId)
                .deptCode(deptCode)
                .deptNm(deptNm)
                .parentDeptId(parentDeptId)
                .deptTypeCd(deptTypeCd)
                .managerId(managerId)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .deptRemark(deptRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
