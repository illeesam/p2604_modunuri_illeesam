package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_prod_content", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 상세 콘텐츠 엔티티
@Comment("상품 상세 컨텐츠 (HTML 에디터)")
public class PdProdContent extends BaseEntity {

    @Id
    @Comment("상품컨텐츠ID")
    @Column(name = "prod_content_id", length = 21, nullable = false)
    private String prodContentId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("컨텐츠유형 (코드: PROD_CONTENT_TYPE — 상세설명, 사용설명, 배송정보, AS정보, 반품정책 등)")
    @Column(name = "content_type_cd", length = 50, nullable = false)
    private String contentTypeCd;

    @Comment("HTML 에디터 컨텐츠")
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
