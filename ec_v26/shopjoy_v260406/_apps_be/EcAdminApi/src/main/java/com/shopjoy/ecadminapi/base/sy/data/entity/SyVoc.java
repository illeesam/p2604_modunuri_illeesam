package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_voc", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 고객의 소리(VOC) 엔티티
@Comment("고객의소리 VOC 분류")
public class SyVoc extends BaseEntity {

    @Id
    @Comment("VOC분류ID (YYMMDDhhmmss+rand4)")
    @Column(name = "voc_id", length = 21, nullable = false)
    private String vocId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("VOC마스터코드 (코드: VOC_MASTER)")
    @Column(name = "voc_master_cd", length = 20, nullable = false)
    private String vocMasterCd;

    @Comment("VOC세부코드 (코드: VOC_DETAIL)")
    @Column(name = "voc_detail_cd", length = 20, nullable = false)
    private String vocDetailCd;

    @Comment("VOC항목명")
    @Column(name = "voc_nm", length = 100, nullable = false)
    private String vocNm;

    @Comment("VOC항목설명")
    @Column(name = "voc_content", columnDefinition = "TEXT")
    private String vocContent;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
