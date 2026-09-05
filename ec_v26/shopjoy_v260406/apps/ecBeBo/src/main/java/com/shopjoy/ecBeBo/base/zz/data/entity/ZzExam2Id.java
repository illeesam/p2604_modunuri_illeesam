package com.shopjoy.ecadminapi.base.zz.data.entity;

import lombok.*;

import java.io.Serializable;

/** zz_exam2 복합 PK (exam1_id, exam2_id) */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class ZzExam2Id implements Serializable {

    private String exam1Id;
    private String exam2Id;
}
