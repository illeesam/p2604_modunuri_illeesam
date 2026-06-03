package com.shopjoy.ecadminapi.base.zz.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "zz_exam1", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// zz_exam1
public class ZzExam1 extends BaseEntity {

    @Id
    @Column(name = "exam1_id", length = 21, nullable = false)
    private String exam1Id;

    @Column(name = "col11", length = 200)
    private String col11;

    @Column(name = "col12", length = 200)
    private String col12;

    @Column(name = "col13", length = 200)
    private String col13;

    @Column(name = "col14", length = 200)
    private String col14;

    @Column(name = "col15", length = 200)
    private String col15;
}
