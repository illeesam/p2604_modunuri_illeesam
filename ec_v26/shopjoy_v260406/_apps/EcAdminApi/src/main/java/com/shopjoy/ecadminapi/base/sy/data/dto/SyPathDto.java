package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyPathDto {

    // ── sy_path ──────────────────────────────────────────
    private String bizCd;
    private Long parentPathId;
    private String pathLabel;
    private Integer sortOrd;
    private String useYn;
    private String pathRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
