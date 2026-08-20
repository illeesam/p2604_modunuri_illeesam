package com.shopjoy.ecadminapi.base.zz.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "zz_exam3", schema = "shopjoy_2604")
@IdClass(ZzExam3Id.class)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// zz_exam3
public class ZzExam3 extends BaseEntity {

    @Id
    @Column(name = "exam1_id", length = 21, nullable = false)
    @Size(max = 21, message = "exam1Id 는 21자 이내여야 합니다.")
    private String exam1Id;

    @Id
    @Column(name = "exam2_id", length = 21, nullable = false)
    @Size(max = 21, message = "exam2Id 는 21자 이내여야 합니다.")
    private String exam2Id;

    @Id
    @Column(name = "exam3_id", length = 21, nullable = false)
    @Size(max = 21, message = "exam3Id 는 21자 이내여야 합니다.")
    private String exam3Id;

    @Column(name = "col31", length = 200)
    @Size(max = 200, message = "col31 는 200자 이내여야 합니다.")
    private String col31;

    @Column(name = "col32", length = 200)
    @Size(max = 200, message = "col32 는 200자 이내여야 합니다.")
    private String col32;

    @Column(name = "col33", length = 200)
    @Size(max = 200, message = "col33 는 200자 이내여야 합니다.")
    private String col33;

    @Column(name = "col34", length = 200)
    @Size(max = 200, message = "col34 는 200자 이내여야 합니다.")
    private String col34;

    @Column(name = "col35", length = 200)
    @Size(max = 200, message = "col35 는 200자 이내여야 합니다.")
    private String col35;
}
