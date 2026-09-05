package com.shopjoy.ecadminapi.base.sy.data.entity;

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
@Table(name = "sy_code_grp", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 공통 코드 그룹 엔티티
@Comment("공통코드 그룹")
public class SyCodeGrp extends BaseEntity {

    @Id
    @Comment("코드그룹ID (YYMMDDhhmmss+rand4)")
    @Column(name = "code_grp_id", length = 21, nullable = false)
    @Size(max = 21, message = "codeGrpId 는 21자 이내여야 합니다.")
    private String codeGrpId;


    @Comment("코드그룹코드 (예: MEMBER_GRADE, UNIQUE with site_id)")
    @Column(name = "code_grp", length = 50, nullable = false)
    @Size(max = 50, message = "codeGrp 는 50자 이내여야 합니다.")
    private String codeGrp;

    @Comment("그룹명")
    @Column(name = "grp_nm", length = 100, nullable = false)
    @Size(max = 100, message = "grpNm 는 100자 이내여야 합니다.")
    private String grpNm;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    @Comment("코드그룹설명")
    @Column(name = "code_grp_desc", length = 300)
    @Size(max = 300, message = "codeGrpDesc 는 300자 이내여야 합니다.")
    private String codeGrpDesc;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
