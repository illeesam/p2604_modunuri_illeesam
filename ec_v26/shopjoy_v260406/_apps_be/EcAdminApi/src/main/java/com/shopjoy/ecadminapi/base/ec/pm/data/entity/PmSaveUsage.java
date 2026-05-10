package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pm_save_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 사용 이력 엔티티
public class PmSaveUsage extends BaseEntity {

    @Id
    @Column(name = "save_usage_id", length = 21, nullable = false)
    private String saveUsageId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "order_item_id", length = 21)
    private String orderItemId;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "use_amt", nullable = false)
    private Long useAmt;

    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Column(name = "used_date")
    private LocalDateTime usedDate;

}
