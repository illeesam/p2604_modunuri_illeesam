package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "settleAdjId 는 21자 이내여야 합니다.")
    private String settleAdjId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    @Size(max = 21, message = "settleId 는 21자 이내여야 합니다.")
    private String settleId;


    @Comment("조정유형 (코드: ADJ_TYPE_CD — ADD/DEDUCT)")
    @Column(name = "adj_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "adjTypeCd 는 20자 이내여야 합니다.")
    private String adjTypeCd;

    @Comment("조정금액 (양수, 유형에 따라 가산/차감)")
    @Column(name = "adj_amt", nullable = false)
    private Long adjAmt;

    @Comment("조정 사유")
    @Column(name = "adj_reason", length = 200, nullable = false)
    @Size(max = 100, message = "adjReason 는 100자 이내여야 합니다.")
    private String adjReason;

    @Comment("메모")
    @Column(name = "settle_adj_memo", columnDefinition = "TEXT")
    @Size(max = 50000, message = "settleAdjMemo 는 50000자 이내여야 합니다.")
    private String settleAdjMemo;

    @Comment("승인상태 (코드: APRV_STATUS_CD — 대기/승인/반려)")
    @Column(name = "aprv_status_cd", length = 20)
    @Size(max = 20, message = "aprvStatusCd 는 20자 이내여야 합니다.")
    private String aprvStatusCd;

}
