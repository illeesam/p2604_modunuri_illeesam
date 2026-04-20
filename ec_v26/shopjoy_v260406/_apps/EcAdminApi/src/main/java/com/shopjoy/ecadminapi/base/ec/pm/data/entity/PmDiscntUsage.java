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
@Table(name = "pm_discnt_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 할인 사용 이력 엔티티
public class PmDiscntUsage {

    @Id
    @Column(name = "discnt_usage_id", length = 21, nullable = false)
    private String discntUsageId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "discnt_id", length = 21, nullable = false)
    private String discntId;

    @Column(name = "discnt_nm", length = 100)
    private String discntNm;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "order_item_id", length = 21)
    private String orderItemId;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "discnt_type_cd", length = 20)
    private String discntTypeCd;

    @Column(name = "discnt_value")
    private BigDecimal discntValue;

    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Column(name = "used_date")
    private LocalDateTime usedDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}