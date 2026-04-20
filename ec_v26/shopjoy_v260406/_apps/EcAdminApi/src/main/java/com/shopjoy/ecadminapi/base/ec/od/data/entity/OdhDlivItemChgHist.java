package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "odh_dliv_item_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 배송 아이템 변경 이력 엔티티
public class OdhDlivItemChgHist {

    @Id
    @Column(name = "dliv_item_chg_hist_id", length = 21, nullable = false)
    private String dlivItemChgHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "dliv_id", length = 21, nullable = false)
    private String dlivId;

    @Column(name = "dliv_item_id", length = 21, nullable = false)
    private String dlivItemId;

    @Column(name = "chg_type_cd", length = 30, nullable = false)
    private String chgTypeCd;

    @Column(name = "chg_field", length = 50)
    private String chgField;

    @Lob
    @Column(name = "before_val", columnDefinition = "TEXT")
    private String beforeVal;

    @Lob
    @Column(name = "after_val", columnDefinition = "TEXT")
    private String afterVal;

    @Column(name = "chg_reason", length = 300)
    private String chgReason;

    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}