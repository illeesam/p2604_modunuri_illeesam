package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "st_settle_adj", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 조정 엔티티
public class StSettleAdj extends BaseEntity {

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

    @Column(name = "settle_adj_memo", columnDefinition = "TEXT")
    private String settleAdjMemo;

    @Column(name = "aprv_status", length = 20)
    private String aprvStatus;

}
