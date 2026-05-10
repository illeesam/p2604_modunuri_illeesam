package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "mb_member_grade", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 등급 엔티티
public class MbMemberGrade extends BaseEntity {

    @Id
    @Column(name = "member_grade_id", length = 21, nullable = false)
    private String memberGradeId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "grade_cd", length = 20, nullable = false)
    private String gradeCd;

    @Column(name = "grade_nm", length = 50, nullable = false)
    private String gradeNm;

    @Column(name = "grade_rank")
    private Integer gradeRank;

    @Column(name = "min_purchase_amt")
    private Long minPurchaseAmt;

    @Column(name = "save_rate")
    private BigDecimal saveRate;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
