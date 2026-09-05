package com.shopjoy.ecadminapi.base.zz.data.entity;

import lombok.*;

import java.io.Serializable;

/** zz_exam3 복합 PK (exam1_id, exam2_id, exam3_id) */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class ZzExam3Id implements Serializable {

    private String exam1Id;
    private String exam2Id;
    private String exam3Id;
}
