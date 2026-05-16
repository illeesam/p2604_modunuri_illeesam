package com.shopjoy.ecadminapi.base.zz.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "zz_exam3", schema = "shopjoy_2604")
@IdClass(ZzExam3Id.class)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// zz_exam3
public class ZzExam3 extends BaseEntity {

    @Id
    @Column(name = "exam1_id", length = 21, nullable = false)
    private String exam1Id;

    @Id
    @Column(name = "exam2_id", length = 21, nullable = false)
    private String exam2Id;

    @Id
    @Column(name = "exam3_id", length = 21, nullable = false)
    private String exam3Id;

    @Column(name = "col31", length = 200)
    private String col31;

    @Column(name = "col32", length = 200)
    private String col32;

    @Column(name = "col33", length = 200)
    private String col33;

    @Column(name = "col34", length = 200)
    private String col34;

    @Column(name = "col35", length = 200)
    private String col35;
}
