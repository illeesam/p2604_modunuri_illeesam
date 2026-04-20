package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_settle_etc_adj", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 기타 조정 엔티티
public class StSettleEtcAdj {

    @Id
    @Column(name = "settle_etc_adj_id", length = 21, nullable = false)
    private String settleEtcAdjId;

    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "etc_adj_type_cd", length = 20, nullable = false)
    private String etcAdjTypeCd;

    @Column(name = "etc_adj_dir_cd", length = 10, nullable = false)
    private String etcAdjDirCd;

    @Column(name = "etc_adj_amt", nullable = false)
    private Long etcAdjAmt;

    @Column(name = "etc_adj_reason", length = 200, nullable = false)
    private String etcAdjReason;

    @Lob
    @Column(name = "settle_etc_adj_memo", columnDefinition = "TEXT")
    private String settleEtcAdjMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}