package com.shopjoy.ecadminapi.base.zz.data.entity;

import lombok.*;

import java.time.LocalDateTime;

/** zz_exmy2 (MyBatis POJO, 복합 PK: exmy1_id, exmy2_id) */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzExmy2 {

    private String exmy1Id;
    private String exmy2Id;
    private String col21;
    private String col22;
    private String col23;
    private String col24;
    private String col25;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
}
