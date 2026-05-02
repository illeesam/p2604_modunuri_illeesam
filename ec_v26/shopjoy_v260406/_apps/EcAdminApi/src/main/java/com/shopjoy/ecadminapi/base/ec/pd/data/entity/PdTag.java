package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 태그 엔티티
public class PdTag extends BaseEntity {

    @Id
    @Column(name = "tag_id", length = 21, nullable = false)
    private String tagId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "tag_nm", length = 100, nullable = false)
    private String tagNm;

    @Column(name = "tag_desc", length = 300)
    private String tagDesc;

    @Column(name = "use_count")
    private Integer useCount;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
