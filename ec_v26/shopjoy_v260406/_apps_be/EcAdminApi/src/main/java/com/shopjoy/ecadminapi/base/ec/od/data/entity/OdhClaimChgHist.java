package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "odh_claim_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 클레임 변경 이력 엔티티
@Comment("클레임 변경 이력")
public class OdhClaimChgHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "claim_chg_hist_id", length = 21, nullable = false)
    private String claimChgHistId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("클레임ID (od_claim.)")
    @Column(name = "claim_id", length = 21, nullable = false)
    private String claimId;

    @Comment("변경유형코드 (CLAIM_TYPE/REASON/AMOUNT/APPROVAL/MEMO/REFUND)")
    @Column(name = "chg_type_cd", length = 30, nullable = false)
    private String chgTypeCd;

    @Comment("변경 필드명")
    @Column(name = "chg_field", length = 50)
    private String chgField;

    @Comment("변경전값")
    @Column(name = "before_val", columnDefinition = "TEXT")
    private String beforeVal;

    @Comment("변경후값")
    @Column(name = "after_val", columnDefinition = "TEXT")
    private String afterVal;

    @Comment("변경사유")
    @Column(name = "chg_reason", length = 300)
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
