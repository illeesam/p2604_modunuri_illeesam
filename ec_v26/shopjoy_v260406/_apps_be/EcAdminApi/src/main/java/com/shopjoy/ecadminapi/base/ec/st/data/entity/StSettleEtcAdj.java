package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "st_settle_etc_adj", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 기타 조정 엔티티
public class StSettleEtcAdj extends BaseEntity {

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

    @Column(name = "settle_etc_adj_memo", columnDefinition = "TEXT")
    private String settleEtcAdjMemo;

}
