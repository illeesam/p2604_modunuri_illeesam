package com.shopjoy.ecadminapi.base.zz.data.entity;

import lombok.*;

import java.time.LocalDateTime;

/** zz_exmy3 (MyBatis POJO, 복합 PK: exmy1_id, exmy2_id, exmy3_id) */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzExmy3 {

    private String exmy1Id;
    private String exmy2Id;
    private String exmy3Id;
    private String col31;
    private String col32;
    private String col33;
    private String col34;
    private String col35;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
}
