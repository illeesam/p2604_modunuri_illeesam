package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_event_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 이벤트 대상 상품 엔티티
@Comment("이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드)")
public class PmEventItem extends BaseEntity {

    @Id
    @Comment("이벤트항목ID (YYMMDDhhmmss+rand4)")
    @Column(name = "event_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "eventItemId 는 21자 이내여야 합니다.")
    private String eventItemId;

    @Comment("이벤트ID (pm_event.event_id)")
    @Column(name = "event_id", length = 21, nullable = false)
    @Size(max = 21, message = "eventId 는 21자 이내여야 합니다.")
    private String eventId;


    @Comment("대상유형 (코드: PROMO_TARGET_TYPE — PRODUCT/CATEGORY/VENDOR/BRAND)")
    @Column(name = "target_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "targetTypeCd 는 20자 이내여야 합니다.")
    private String targetTypeCd;

    @Comment("대상ID (prod_id / category_id / vendor_id / brand_id)")
    @Column(name = "target_id", length = 21, nullable = false)
    @Size(max = 21, message = "targetId 는 21자 이내여야 합니다.")
    private String targetId;

    @Comment("이벤트 내 노출 순서")
    @Column(name = "sort_no")
    private Integer sortNo;

}
