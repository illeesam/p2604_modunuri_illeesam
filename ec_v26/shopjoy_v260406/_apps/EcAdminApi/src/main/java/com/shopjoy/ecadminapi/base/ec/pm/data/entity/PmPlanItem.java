package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pm_plan_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 프로모션 플랜 아이템 엔티티
public class PmPlanItem extends BaseEntity {

    @Id
    @Column(name = "plan_item_id", length = 21, nullable = false)
    private String planItemId;

    @Column(name = "plan_id", length = 21, nullable = false)
    private String planId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "plan_item_memo", length = 500)
    private String planItemMemo;

}
