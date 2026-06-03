package com.shopjoy.ecadminapi.base.zz.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "zz_exam2", schema = "shopjoy_2604")
@IdClass(ZzExam2Id.class)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// zz_exam2
public class ZzExam2 extends BaseEntity {

    @Id
    @Column(name = "exam1_id", length = 21, nullable = false)
    private String exam1Id;

    @Id
    @Column(name = "exam2_id", length = 21, nullable = false)
    private String exam2Id;

    @Column(name = "col21", length = 200)
    private String col21;

    @Column(name = "col22", length = 200)
    private String col22;

    @Column(name = "col23", length = 200)
    private String col23;

    @Column(name = "col24", length = 200)
    private String col24;

    @Column(name = "col25", length = 200)
    private String col25;
}
