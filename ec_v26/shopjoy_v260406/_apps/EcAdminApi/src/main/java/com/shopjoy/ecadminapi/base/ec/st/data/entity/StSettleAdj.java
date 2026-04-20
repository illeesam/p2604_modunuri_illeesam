package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_settle_adj", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 조정 엔티티
public class StSettleAdj {

    @Id
    @Column(name = "settle_adj_id", length = 21, nullable = false)
    private String settleAdjId;

    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "adj_type_cd", length = 20, nullable = false)
    private String adjTypeCd;

    @Column(name = "adj_amt", nullable = false)
    private Long adjAmt;

    @Column(name = "adj_reason", length = 200, nullable = false)
    private String adjReason;

    @Lob
    @Column(name = "settle_adj_memo", columnDefinition = "TEXT")
    private String settleAdjMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}