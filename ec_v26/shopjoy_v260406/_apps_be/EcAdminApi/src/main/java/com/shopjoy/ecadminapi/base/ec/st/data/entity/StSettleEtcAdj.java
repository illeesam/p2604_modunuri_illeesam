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
@Table(name = "st_settle_etc_adj", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 기타 조정 엔티티
@Comment("정산 기타조정")
public class StSettleEtcAdj extends BaseEntity {

    @Id
    @Comment("기타조정ID")
    @Column(name = "settle_etc_adj_id", length = 21, nullable = false)
    @Size(max = 21, message = "settleEtcAdjId 는 21자 이내여야 합니다.")
    private String settleEtcAdjId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    @Size(max = 21, message = "settleId 는 21자 이내여야 합니다.")
    private String settleId;


    @Comment("기타조정유형 (코드: ETC_ADJ_TYPE_CD — SHIP/RETURN_SHIP/PENALTY/OTHER)")
    @Column(name = "etc_adj_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "etcAdjTypeCd 는 20자 이내여야 합니다.")
    private String etcAdjTypeCd;

    @Comment("가산/차감 (코드: ETC_ADJ_DIR_CD — ADD/DEDUCT)")
    @Column(name = "etc_adj_dir_cd", length = 10, nullable = false)
    @Size(max = 10, message = "etcAdjDirCd 는 10자 이내여야 합니다.")
    private String etcAdjDirCd;

    @Comment("기타조정 금액")
    @Column(name = "etc_adj_amt", nullable = false)
    private Long etcAdjAmt;

    @Comment("사유")
    @Column(name = "etc_adj_reason", length = 200, nullable = false)
    @Size(max = 100, message = "etcAdjReason 는 100자 이내여야 합니다.")
    private String etcAdjReason;

    @Comment("메모")
    @Column(name = "settle_etc_adj_memo", columnDefinition = "TEXT")
    @Size(max = 50000, message = "settleEtcAdjMemo 는 50000자 이내여야 합니다.")
    private String settleEtcAdjMemo;

}
