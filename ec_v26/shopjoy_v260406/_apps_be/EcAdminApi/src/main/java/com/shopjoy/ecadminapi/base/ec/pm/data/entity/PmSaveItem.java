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
@Table(name = "pm_save_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 대상 상품 엔티티
@Comment("적립금 대상 상품 (pm_save 하위 항목)")
public class PmSaveItem extends BaseEntity {

    @Id
    @Comment("PK: SAI+yyMMddHHmmss+rand4")
    @Column(name = "save_item_id", length = 21, nullable = false)
    private String saveItemId;

    @Comment("FK: pm_save.save_id (적립금 ID)")
    @Column(name = "save_id", length = 21, nullable = false)
    private String saveId;

    @Comment("FK: sy_site.site_id (NULL=전사 공통)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("대상 유형 코드 (sy_code: SAVE_ITEM_TARGET)")
    @Column(name = "target_type_cd", length = 20, nullable = false)
    private String targetTypeCd;

    @Comment("대상 ID (상품·카테고리·브랜드 등)")
    @Column(name = "target_id", length = 21, nullable = false)
    private String targetId;

}
