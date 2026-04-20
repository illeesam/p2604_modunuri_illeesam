package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_member_grade", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 회원 등급 엔티티
public class MbMemberGrade {

    @Id
    @Column(name = "grade_id", length = 21, nullable = false)
    private String gradeId;

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}