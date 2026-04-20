package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_settle_config", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 설정 엔티티
public class StSettleConfig {

    @Id
    @Column(name = "settle_config_id", length = 21, nullable = false)
    private String settleConfigId;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "category_id", length = 21)
    private String categoryId;

    @Column(name = "settle_cycle_cd", length = 20)
    private String settleCycleCd;

    @Column(name = "settle_day")
    private Integer settleDay;

    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Column(name = "min_settle_amt")
    private Long minSettleAmt;

    @Column(name = "settle_config_remark", length = 500)
    private String settleConfigRemark;

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