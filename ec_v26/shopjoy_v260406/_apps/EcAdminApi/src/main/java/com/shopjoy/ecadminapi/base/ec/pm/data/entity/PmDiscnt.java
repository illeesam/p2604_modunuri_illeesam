package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_discnt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 할인 엔티티
public class PmDiscnt {

    @Id
    @Column(name = "discnt_id", length = 21, nullable = false)
    private String discntId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "discnt_nm", length = 100, nullable = false)
    private String discntNm;

    @Column(name = "discnt_type_cd", length = 20, nullable = false)
    private String discntTypeCd;

    @Column(name = "discnt_target_cd", length = 20)
    private String discntTargetCd;

    @Column(name = "discnt_value")
    private BigDecimal discntValue;

    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Column(name = "min_order_qty")
    private Integer minOrderQty;

    @Column(name = "max_discnt_amt")
    private Long maxDiscntAmt;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "discnt_status_cd", length = 20)
    private String discntStatusCd;

    @Column(name = "discnt_status_cd_before", length = 20)
    private String discntStatusCdBefore;

    @Lob
    @Column(name = "discnt_desc", columnDefinition = "TEXT")
    private String discntDesc;

    @Column(name = "mem_grade_cd", length = 20)
    private String memGradeCd;

    @Column(name = "self_cdiv_rate")
    private BigDecimal selfCdivRate;

    @Column(name = "seller_cdiv_rate")
    private BigDecimal sellerCdivRate;

    @Column(name = "dvc_pc_yn", length = 1)
    private String dvcPcYn;

    @Column(name = "dvc_mweb_yn", length = 1)
    private String dvcMwebYn;

    @Column(name = "dvc_mapp_yn", length = 1)
    private String dvcMappYn;

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