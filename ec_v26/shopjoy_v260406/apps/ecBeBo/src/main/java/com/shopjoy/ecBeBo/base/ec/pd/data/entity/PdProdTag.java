package com.shopjoy.ecBeBo.base.ec.pd.data.entity;

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
@Table(name = "pd_prod_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 태그 엔티티
@Comment("상품-태그 매핑")
public class PdProdTag extends BaseEntity {

    @Id
    @Comment("상품태그ID")
    @Column(name = "prod_tag_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodTagId 는 21자 이내여야 합니다.")
    private String prodTagId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("태그ID (pd_tag.)")
    @Column(name = "tag_id", length = 21, nullable = false)
    @Size(max = 21, message = "tagId 는 21자 이내여야 합니다.")
    private String tagId;

}
