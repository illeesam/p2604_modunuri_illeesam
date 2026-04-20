package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_save", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 적립금 엔티티
public class PmSave {

    @Id
    @Column(name = "save_id", length = 21, nullable = false)
    private String saveId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "save_type_cd", length = 20, nullable = false)
    private String saveTypeCd;

    @Column(name = "save_amt", nullable = false)
    private Long saveAmt;

    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Lob
    @Column(name = "save_memo", columnDefinition = "TEXT")
    private String saveMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}