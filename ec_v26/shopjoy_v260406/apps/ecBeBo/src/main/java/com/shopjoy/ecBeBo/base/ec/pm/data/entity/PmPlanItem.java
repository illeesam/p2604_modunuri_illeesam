package com.shopjoy.ecBeBo.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "planItemId 는 21자 이내여야 합니다.")
    private String planItemId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("기획전ID (pm_plan.plan_id)")
    @Column(name = "plan_id", length = 21, nullable = false)
    @Size(max = 21, message = "planId 는 21자 이내여야 합니다.")
    private String planId;


    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("항목 메모 (특가/한정수량 등)")
    @Column(name = "plan_item_memo", length = 500)
    @Size(max = 500, message = "planItemMemo 는 500자 이내여야 합니다.")
    private String planItemMemo;

}
