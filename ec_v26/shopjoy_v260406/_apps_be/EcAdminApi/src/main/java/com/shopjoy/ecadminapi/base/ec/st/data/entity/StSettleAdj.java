package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "st_settle_adj", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 조정 엔티티
@Comment("정산조정")
public class StSettleAdj extends BaseEntity {

    @Id
    @Comment("정산조정ID")
    @Column(name = "settle_adj_id", length = 21, nullable = false)
    private String settleAdjId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("조정유형 (코드: SETTLE_ADJ_TYPE — ADD/DEDUCT)")
    @Column(name = "adj_type_cd", length = 20, nullable = false)
    private String adjTypeCd;

    @Comment("조정금액 (양수, 유형에 따라 가산/차감)")
    @Column(name = "adj_amt", nullable = false)
    private Long adjAmt;

    @Comment("조정 사유")
    @Column(name = "adj_reason", length = 200, nullable = false)
    private String adjReason;

    @Comment("메모")
    @Column(name = "settle_adj_memo", columnDefinition = "TEXT")
    private String settleAdjMemo;

    @Comment("승인상태 (코드: SETTLE_ADJ_STATUS — 대기/승인/반려)")
    @Column(name = "aprv_status_cd", length = 20)
    private String aprvStatusCd;

}
