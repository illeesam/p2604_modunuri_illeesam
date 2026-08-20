package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

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
@Table(name = "pd_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 태그 엔티티
@Comment("태그")
public class PdTag extends BaseEntity {

    @Id
    @Comment("태그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "tag_id", length = 21, nullable = false)
    @Size(max = 21, message = "tagId 는 21자 이내여야 합니다.")
    private String tagId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("태그명")
    @Column(name = "tag_nm", length = 100, nullable = false)
    @Size(max = 100, message = "tagNm 는 100자 이내여야 합니다.")
    private String tagNm;

    @Comment("태그설명")
    @Column(name = "tag_desc", length = 300)
    @Size(max = 100, message = "tagDesc 는 100자 이내여야 합니다.")
    private String tagDesc;

    @Comment("사용 빈도")
    @Column(name = "use_count")
    private Integer useCount;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
