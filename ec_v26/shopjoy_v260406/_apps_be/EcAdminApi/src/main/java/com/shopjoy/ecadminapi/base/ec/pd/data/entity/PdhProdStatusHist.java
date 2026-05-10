package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pdh_prod_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 상태 이력 엔티티
public class PdhProdStatusHist extends BaseEntity {

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

}
