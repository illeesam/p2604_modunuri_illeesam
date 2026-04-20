package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyDeptDto {

    // ── sy_dept ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
