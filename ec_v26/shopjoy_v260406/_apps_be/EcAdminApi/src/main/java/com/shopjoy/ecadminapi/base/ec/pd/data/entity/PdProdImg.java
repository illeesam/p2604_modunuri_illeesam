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
@Table(name = "pd_prod_img", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 이미지 엔티티
@Comment("상품 이미지")
public class PdProdImg extends BaseEntity {

    @Id
    @Comment("상품이미지ID")
    @Column(name = "prod_img_id", length = 21, nullable = false)
    private String prodImgId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("옵션1 값ID (pd_prod_opt_item.opt_item_id, 색상 등, NULL이면 공통 이미지)")
    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Comment("옵션2 값ID (pd_prod_opt_item.opt_item_id, 사이즈 등, NULL이면 색상 공통)")
    @Column(name = "opt_item_id_2", length = 21)
    private String optItemId2;

    @Comment("첨부파일ID (sy_attach.attach_id, 원본 파일 보관용)")
    @Column(name = "attach_id", length = 21)
    private String attachId;

    @Comment("CDN 호스트명 (예: cdn.example.com, 원본 시점의 CDN)")
    @Column(name = "cdn_host", length = 100)
    private String cdnHost;

    @Comment("CDN 원본 이미지 URL (상세 페이지용, sy_attach 기준)")
    @Column(name = "cdn_img_url", columnDefinition = "TEXT")
    private String cdnImgUrl;

    @Comment("CDN 썸네일 URL (목록/검색/카테고리용, sy_attach 기준)")
    @Column(name = "cdn_thumb_url", columnDefinition = "TEXT")
    private String cdnThumbUrl;

    @Comment("이미지 대체텍스트 (alt 속성, SEO/접근성)")
    @Column(name = "img_alt_text", length = 200)
    private String imgAltText;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("대표이미지여부 Y/N")
    @Column(name = "is_thumb", length = 1)
    private String isThumb;

}
