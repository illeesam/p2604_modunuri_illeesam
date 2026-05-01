package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pm_discnt_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 할인 대상 상품 엔티티
public class PmDiscntItem {

    @Id
    @Column(name = "discnt_item_id", length = 21, nullable = false)
    private String discntItemId;

    @Column(name = "discnt_id", length = 21, nullable = false)
    private String discntId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "target_type_cd", length = 20, nullable = false)
    private String targetTypeCd;

    @Column(name = "target_id", length = 21, nullable = false)
    private String targetId;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}