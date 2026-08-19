package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "propId 는 21자 이내여야 합니다.")
    private String propId;


    @Comment("점(.) 구분 표시경로 (aa.bb.cc)")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    @Comment("키 (코드 식별자)")
    @Column(name = "prop_key", length = 100, nullable = false)
    @Size(max = 100, message = "propKey 는 100자 이내여야 합니다.")
    private String propKey;

    @Comment("값")
    @Column(name = "prop_value", columnDefinition = "TEXT")
    @Size(max = 500000, message = "propValue 는 500,000자 이내여야 합니다.")
    private String propValue;

    @Comment("표시명")
    @Column(name = "prop_label", length = 200, nullable = false)
    @Size(max = 100, message = "propLabel 는 100자 이내여야 합니다.")
    private String propLabel;

    @Comment("값 타입 (코드: PROP_TYPE_CD — STRING/NUMBER/BOOLEAN/JSON)")
    @Column(name = "prop_type_cd", length = 20)
    @Size(max = 20, message = "propTypeCd 는 20자 이내여야 합니다.")
    private String propTypeCd;

    @Comment("같은 표시경로 내 정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("비고")
    @Column(name = "prop_remark", length = 500)
    @Size(max = 100, message = "propRemark 는 100자 이내여야 합니다.")
    private String propRemark;

    @Comment("적용 프로파일 (^local^dev^prod^ 형식, 비어있으면 전체 환경 적용)")
    @Column(name = "prop_profile", length = 100)
    @Size(max = 100, message = "propProfile 는 100자 이내여야 합니다.")
    private String propProfile;

}
