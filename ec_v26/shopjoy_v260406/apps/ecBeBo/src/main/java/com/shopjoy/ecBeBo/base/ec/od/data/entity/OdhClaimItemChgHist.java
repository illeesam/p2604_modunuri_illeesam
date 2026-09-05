package com.shopjoy.ecBeBo.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "odh_claim_item_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 클레임 아이템 변경 이력 엔티티
@Comment("클레임 품목 변경 이력")
public class OdhClaimItemChgHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "claim_item_chg_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "claimItemChgHistId 는 21자 이내여야 합니다.")
    private String claimItemChgHistId;


    @Comment("클레임ID (od_claim.)")
    @Column(name = "claim_id", length = 21, nullable = false)
    @Size(max = 21, message = "claimId 는 21자 이내여야 합니다.")
    private String claimId;

    @Comment("클레임품목ID (od_claim_item.)")
    @Column(name = "claim_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "claimItemId 는 21자 이내여야 합니다.")
    private String claimItemId;

    @Comment("변경유형코드 (QTY/AMOUNT/REASON/STATUS/REFUND_AMT)")
    @Column(name = "chg_type_cd", length = 30, nullable = false)
    @Size(max = 30, message = "chgTypeCd 는 30자 이내여야 합니다.")
    private String chgTypeCd;

    @Comment("변경 필드명")
    @Column(name = "chg_field", length = 50)
    @Size(max = 50, message = "chgField 는 50자 이내여야 합니다.")
    private String chgField;

    @Comment("변경전값")
    @Column(name = "before_val", columnDefinition = "TEXT")
    @Size(max = 50000, message = "beforeVal 는 50000자 이내여야 합니다.")
    private String beforeVal;

    @Comment("변경후값")
    @Column(name = "after_val", columnDefinition = "TEXT")
    @Size(max = 50000, message = "afterVal 는 50000자 이내여야 합니다.")
    private String afterVal;

    @Comment("변경사유")
    @Column(name = "chg_reason", length = 300)
    @Size(max = 300, message = "chgReason 는 300자 이내여야 합니다.")
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_user_id", length = 21)
    @Size(max = 21, message = "chgUserId 는 21자 이내여야 합니다.")
    private String chgUserId;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
