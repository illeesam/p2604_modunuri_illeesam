package com.shopjoy.ecadminapi.base.ec.pd.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 태그 엔티티
public class PdProdTag {

    @Id
    @Column(name = "prod_tag_id", length = 20, nullable = false)
    private String prodTagId;

    @Column(name = "site_id", length = 20)
    private String siteId;

    @Column(name = "prod_id", length = 20, nullable = false)
    private String prodId;

    @Column(name = "tag_id", length = 20, nullable = false)
    private String tagId;

    @Column(name = "reg_by", length = 20)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

}