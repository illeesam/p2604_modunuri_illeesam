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
@Table(name = "pm_save_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 대상 상품 엔티티
@Comment("적립금 대상 상품 (pm_save 하위 항목)")
public class PmSaveItem extends BaseEntity {

    @Id
    @Comment("PK: SAI+yyMMddHHmmss+rand4")
    @Column(name = "save_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "saveItemId 는 21자 이내여야 합니다.")
    private String saveItemId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("FK: pm_save.save_id (적립금 ID)")
    @Column(name = "save_id", length = 21, nullable = false)
    @Size(max = 21, message = "saveId 는 21자 이내여야 합니다.")
    private String saveId;

    @Comment("대상 유형 코드 (sy_code: SAVE_ITEM_TARGET)")
    @Column(name = "target_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "targetTypeCd 는 20자 이내여야 합니다.")
    private String targetTypeCd;

    @Comment("대상 ID (상품·카테고리·브랜드 등)")
    @Column(name = "target_id", length = 21, nullable = false)
    @Size(max = 21, message = "targetId 는 21자 이내여야 합니다.")
    private String targetId;

}
