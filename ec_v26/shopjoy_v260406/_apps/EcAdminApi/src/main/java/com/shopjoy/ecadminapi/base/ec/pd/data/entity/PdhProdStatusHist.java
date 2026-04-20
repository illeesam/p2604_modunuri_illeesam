package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pdh_prod_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 상태 이력 엔티티
public class PdhProdStatusHist {

    @Id
    @Column(name = "prod_status_hist_id", length = 21, nullable = false)
    private String prodStatusHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "before_status_cd", length = 20)
    private String beforeStatusCd;

    @Column(name = "after_status_cd", length = 20, nullable = false)
    private String afterStatusCd;

    @Column(name = "memo", length = 300)
    private String memo;

    @Column(name = "proc_user_id", length = 21)
    private String procUserId;

    @Column(name = "proc_date")
    private LocalDateTime procDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}