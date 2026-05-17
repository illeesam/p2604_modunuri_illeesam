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
@Table(name = "pm_discnt_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 할인 대상 상품 엔티티
@Comment("할인 대상 항목")
public class PmDiscntItem extends BaseEntity {

    @Id
    @Comment("할인항목ID")
    @Column(name = "discnt_item_id", length = 21, nullable = false)
    private String discntItemId;

    @Comment("할인ID (pm_discnt.discnt_id)")
    @Column(name = "discnt_id", length = 21, nullable = false)
    private String discntId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("대상유형 (코드: DISCNT_ITEM_TARGET)")
    @Column(name = "target_type_cd", length = 20, nullable = false)
    private String targetTypeCd;

    @Comment("대상ID (category_id/prod_id/grade_cd)")
    @Column(name = "target_id", length = 21, nullable = false)
    private String targetId;

}
