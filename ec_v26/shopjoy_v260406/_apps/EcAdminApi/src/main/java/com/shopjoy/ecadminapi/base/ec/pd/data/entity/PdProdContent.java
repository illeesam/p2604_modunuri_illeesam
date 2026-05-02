package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_prod_content", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 상세 콘텐츠 엔티티
public class PdProdContent extends BaseEntity {

    @Id
    @Column(name = "prod_content_id", length = 21, nullable = false)
    private String prodContentId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "content_type_cd", length = 50, nullable = false)
    private String contentTypeCd;

    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
