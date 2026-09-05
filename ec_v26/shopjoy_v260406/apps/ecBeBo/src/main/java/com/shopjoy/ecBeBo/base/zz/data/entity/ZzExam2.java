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
@Table(name = "zz_exam2", schema = "shopjoy_2604")
@IdClass(ZzExam2Id.class)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// zz_exam2
public class ZzExam2 extends BaseEntity {

    @Id
    @Column(name = "exam1_id", length = 21, nullable = false)
    @Size(max = 21, message = "exam1Id 는 21자 이내여야 합니다.")
    private String exam1Id;

    @Id
    @Column(name = "exam2_id", length = 21, nullable = false)
    @Size(max = 21, message = "exam2Id 는 21자 이내여야 합니다.")
    private String exam2Id;

    @Column(name = "col21", length = 200)
    @Size(max = 200, message = "col21 는 200자 이내여야 합니다.")
    private String col21;

    @Column(name = "col22", length = 200)
    @Size(max = 200, message = "col22 는 200자 이내여야 합니다.")
    private String col22;

    @Column(name = "col23", length = 200)
    @Size(max = 200, message = "col23 는 200자 이내여야 합니다.")
    private String col23;

    @Column(name = "col24", length = 200)
    @Size(max = 200, message = "col24 는 200자 이내여야 합니다.")
    private String col24;

    @Column(name = "col25", length = 200)
    @Size(max = 200, message = "col25 는 200자 이내여야 합니다.")
    private String col25;
}
