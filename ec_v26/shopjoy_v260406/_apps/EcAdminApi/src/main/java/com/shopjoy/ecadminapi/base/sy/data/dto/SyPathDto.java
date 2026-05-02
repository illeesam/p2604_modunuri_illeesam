package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyPathDto {

    private String pathId;
    private String bizCd;
    private String parentPathId;
    private String pathLabel;
    private Integer sortOrd;
    private String useYn;
    private String pathRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
}
