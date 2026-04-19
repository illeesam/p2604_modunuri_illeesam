package com.shopjoy.ecadminapi.domain.pm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_save_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PmSaveUsage {

    @Id
    @Column(name = "save_usage_id", length = 20, nullable = false)
    private String saveUsageId;

    @Column(name = "site_id", length = 20)
    private String siteId;

    @Column(name = "member_id", length = 20, nullable = false)
    private String memberId;

    @Column(name = "order_id", length = 20)
    private String orderId;

    @Column(name = "order_item_id", length = 20)
    private String orderItemId;

    @Column(name = "prod_id", length = 20)
    private String prodId;

    @Column(name = "use_amt", nullable = false)
    private Long useAmt;

    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Column(name = "used_date")
    private LocalDateTime usedDate;

    @Column(name = "reg_by", length = 20)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

}