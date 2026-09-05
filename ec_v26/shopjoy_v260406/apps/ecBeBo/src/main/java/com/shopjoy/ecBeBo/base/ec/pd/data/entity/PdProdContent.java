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
@Table(name = "pd_prod_content", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 상세 콘텐츠 엔티티
@Comment("상품 상세 컨텐츠 (HTML 에디터)")
public class PdProdContent extends BaseEntity {

    @Id
    @Comment("상품컨텐츠ID")
    @Column(name = "prod_content_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodContentId 는 21자 이내여야 합니다.")
    private String prodContentId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("컨텐츠유형 (코드: PROD_CONTENT_TYPE — 상세설명, 사용설명, 배송정보, AS정보, 반품정책 등)")
    @Column(name = "content_type_cd", length = 50, nullable = false)
    @Size(max = 50, message = "contentTypeCd 는 50자 이내여야 합니다.")
    private String contentTypeCd;

    /* 상품 상세설명은 이미지가 많이 들어가는 페이지라 넉넉하게 잡는다.
       에디터가 이미지를 서버 업로드 없이 base64 그대로 인라인하므로(BaseComp.js addImageBlobHook),
       스마트폰 원본 사진 한 장만 해도 base64 변환 시 수백만 자가 될 수 있다 — 여러 장 첨부 대비 상한을 크게 둔다. */
    @Comment("HTML 에디터 컨텐츠 (file/url 타입은 CDN URL 문자열)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    @Size(max = 10000000, message = "contentHtml 는 10,000,000자 이내여야 합니다.")
    private String contentHtml;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
