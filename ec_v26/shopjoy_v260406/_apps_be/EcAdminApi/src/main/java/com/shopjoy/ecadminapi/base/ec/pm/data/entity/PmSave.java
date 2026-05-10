package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pm_save", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 엔티티
public class PmSave extends BaseEntity {

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

    @Column(name = "save_memo", columnDefinition = "TEXT")
    private String saveMemo;

}
