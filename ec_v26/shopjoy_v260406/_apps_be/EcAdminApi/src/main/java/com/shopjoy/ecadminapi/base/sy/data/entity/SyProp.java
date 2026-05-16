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
@Table(name = "sy_prop", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 시스템 속성 엔티티
@Comment("프로퍼티 (환경설정/공통 파라미터)")
public class SyProp extends BaseEntity {

    @Id
    @Comment("프로퍼티ID (PK, auto)")
    @Column(name = "prop_id", length = 21)
    private String propId;

    @Comment("사이트ID (sy_site.site_id, NULL=전역)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("점(.) 구분 표시경로 (aa.bb.cc)")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("키 (코드 식별자)")
    @Column(name = "prop_key", length = 100, nullable = false)
    private String propKey;

    @Comment("값")
    @Column(name = "prop_value", columnDefinition = "TEXT")
    private String propValue;

    @Comment("표시명")
    @Column(name = "prop_label", length = 200, nullable = false)
    private String propLabel;

    @Comment("값 타입 (코드: PROP_TYPE — STRING/NUMBER/BOOLEAN/JSON)")
    @Column(name = "prop_type_cd", length = 20)
    private String propTypeCd;

    @Comment("같은 표시경로 내 정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "prop_remark", length = 500)
    private String propRemark;

}
