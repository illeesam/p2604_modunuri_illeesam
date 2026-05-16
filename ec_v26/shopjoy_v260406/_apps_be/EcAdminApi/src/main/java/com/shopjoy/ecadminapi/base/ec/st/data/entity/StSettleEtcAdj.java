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
@Table(name = "st_settle_etc_adj", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 기타 조정 엔티티
@Comment("정산 기타조정")
public class StSettleEtcAdj extends BaseEntity {

    @Id
    @Comment("기타조정ID")
    @Column(name = "settle_etc_adj_id", length = 21, nullable = false)
    private String settleEtcAdjId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("기타조정유형 (코드: SETTLE_ETC_ADJ_TYPE — SHIP/RETURN_SHIP/PENALTY/OTHER)")
    @Column(name = "etc_adj_type_cd", length = 20, nullable = false)
    private String etcAdjTypeCd;

    @Comment("가산/차감 (코드: ADJ_DIR — ADD/DEDUCT)")
    @Column(name = "etc_adj_dir_cd", length = 10, nullable = false)
    private String etcAdjDirCd;

    @Comment("기타조정 금액")
    @Column(name = "etc_adj_amt", nullable = false)
    private Long etcAdjAmt;

    @Comment("사유")
    @Column(name = "etc_adj_reason", length = 200, nullable = false)
    private String etcAdjReason;

    @Comment("메모")
    @Column(name = "settle_etc_adj_memo", columnDefinition = "TEXT")
    private String settleEtcAdjMemo;

}
