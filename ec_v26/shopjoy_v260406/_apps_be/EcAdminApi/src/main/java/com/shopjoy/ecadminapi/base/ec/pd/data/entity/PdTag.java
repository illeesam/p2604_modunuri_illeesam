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
@Table(name = "pd_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 태그 엔티티
@Comment("태그")
public class PdTag extends BaseEntity {

    @Id
    @Comment("태그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "tag_id", length = 21, nullable = false)
    private String tagId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("태그명")
    @Column(name = "tag_nm", length = 100, nullable = false)
    private String tagNm;

    @Comment("태그설명")
    @Column(name = "tag_desc", length = 300)
    private String tagDesc;

    @Comment("사용 빈도")
    @Column(name = "use_count")
    private Integer useCount;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
