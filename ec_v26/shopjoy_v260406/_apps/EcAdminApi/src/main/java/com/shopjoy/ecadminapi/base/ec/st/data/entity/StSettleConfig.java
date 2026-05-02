package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "st_settle_config", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 설정 엔티티
public class StSettleConfig extends BaseEntity {

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

}
