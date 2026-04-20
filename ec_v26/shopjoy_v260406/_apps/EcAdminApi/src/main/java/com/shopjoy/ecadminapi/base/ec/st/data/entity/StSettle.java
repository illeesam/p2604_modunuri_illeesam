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
@Table(name = "st_settle", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 엔티티
public class StSettle {

    @Id
    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "settle_ym", length = 6, nullable = false)
    private String settleYm;

    @Column(name = "settle_start_date", nullable = false)
    private LocalDateTime settleStartDate;

    @Column(name = "settle_end_date", nullable = false)
    private LocalDateTime settleEndDate;

    @Column(name = "total_order_amt")
    private Long totalOrderAmt;

    @Column(name = "total_return_amt")
    private Long totalReturnAmt;

    @Column(name = "total_claim_cnt")
    private Integer totalClaimCnt;

    @Column(name = "total_discnt_amt")
    private Long totalDiscntAmt;

    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Column(name = "commission_amt")
    private Long commissionAmt;

    @Column(name = "settle_amt")
    private Long settleAmt;

    @Column(name = "adj_amt")
    private Long adjAmt;

    @Column(name = "etc_adj_amt")
    private Long etcAdjAmt;

    @Column(name = "final_settle_amt")
    private Long finalSettleAmt;

    @Column(name = "settle_status_cd", length = 20)
    private String settleStatusCd;

    @Column(name = "settle_status_cd_before", length = 20)
    private String settleStatusCdBefore;

    @Lob
    @Column(name = "settle_memo", columnDefinition = "TEXT")
    private String settleMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}