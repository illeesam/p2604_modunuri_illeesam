package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pm_plan_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 프로모션 플랜 아이템 엔티티
@Comment("기획전 상품")
public class PmPlanItem extends BaseEntity {

    @Id
    @Comment("기획전상품ID")
    @Column(name = "plan_item_id", length = 21, nullable = false)
    private String planItemId;

    @Comment("기획전ID (pm_plan.plan_id)")
    @Column(name = "plan_id", length = 21, nullable = false)
    private String planId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("항목 메모 (특가/한정수량 등)")
    @Column(name = "plan_item_memo", length = 500)
    private String planItemMemo;

}
