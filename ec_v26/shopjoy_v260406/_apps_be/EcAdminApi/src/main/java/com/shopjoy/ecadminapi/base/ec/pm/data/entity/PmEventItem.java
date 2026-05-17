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
@Table(name = "pm_event_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 이벤트 대상 상품 엔티티
@Comment("이벤트 적용 대상 항목 (상품/카테고리/판매자/브랜드)")
public class PmEventItem extends BaseEntity {

    @Id
    @Comment("이벤트항목ID (YYMMDDhhmmss+rand4)")
    @Column(name = "event_item_id", length = 21, nullable = false)
    private String eventItemId;

    @Comment("이벤트ID (pm_event.event_id)")
    @Column(name = "event_id", length = 21, nullable = false)
    private String eventId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("대상유형 (코드: EVENT_ITEM_TARGET — PRODUCT/CATEGORY/VENDOR/BRAND)")
    @Column(name = "target_type_cd", length = 20, nullable = false)
    private String targetTypeCd;

    @Comment("대상ID (prod_id / category_id / vendor_id / brand_id)")
    @Column(name = "target_id", length = 21, nullable = false)
    private String targetId;

    @Comment("이벤트 내 노출 순서")
    @Column(name = "sort_no")
    private Integer sortNo;

}
