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
@Table(name = "odh_dliv_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배송 변경 이력 엔티티
@Comment("배송 변경 이력")
public class OdhDlivChgHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "dliv_chg_hist_id", length = 21, nullable = false)
    private String dlivChgHistId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("배송ID")
    @Column(name = "dliv_id", length = 21, nullable = false)
    private String dlivId;

    @Comment("변경유형코드 (COURIER/TRACKING/RECV_INFO/MEMO/SPLIT/MERGE)")
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
