package com.shopjoy.ecadminapi.base.ec.pm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_discnt_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 할인 대상 상품 엔티티
public class PmDiscntItem {

    @Id
    @Column(name = "discnt_item_id", length = 20, nullable = false)
    private String discntItemId;

    @Column(name = "discnt_id", length = 20, nullable = false)
    private String discntId;

    @Column(name = "site_id", length = 20)
    private String siteId;

    @Column(name = "target_type_cd", length = 20, nullable = false)
    private String targetTypeCd;

    @Column(name = "target_id", length = 20, nullable = false)
    private String targetId;

    @Column(name = "reg_by", length = 20)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

}