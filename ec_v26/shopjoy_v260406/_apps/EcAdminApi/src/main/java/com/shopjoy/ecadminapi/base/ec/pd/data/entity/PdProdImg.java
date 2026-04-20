package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_img", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 이미지 엔티티
public class PdProdImg {

    @Id
    @Column(name = "prod_img_id", length = 21, nullable = false)
    private String prodImgId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "opt_item_id_1", length = 20)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 20)
    private String optItemId2;

    @Column(name = "attach_id", length = 21)
    private String attachId;

    @Column(name = "cdn_host", length = 100)
    private String cdnHost;

    @Column(name = "cdn_img_url", length = 500)
    private String cdnImgUrl;

    @Column(name = "cdn_thumb_url", length = 500)
    private String cdnThumbUrl;

    @Column(name = "img_alt_text", length = 200)
    private String imgAltText;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "is_thumb", length = 1)
    private String isThumb;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}