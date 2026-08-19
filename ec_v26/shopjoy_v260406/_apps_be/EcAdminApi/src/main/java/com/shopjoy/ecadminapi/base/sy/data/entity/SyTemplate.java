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
@Table(name = "sy_template", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 템플릿 엔티티
@Comment("발송 템플릿")
public class SyTemplate extends BaseEntity {

    @Id
    @Comment("템플릿ID (YYMMDDhhmmss+rand4)")
    @Column(name = "template_id", length = 21, nullable = false)
    @Size(max = 21, message = "templateId 는 21자 이내여야 합니다.")
    private String templateId;


    @Comment("템플릿유형 (코드: TEMPLATE_TYPE_CD)")
    @Column(name = "template_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "templateTypeCd 는 20자 이내여야 합니다.")
    private String templateTypeCd;

    @Comment("템플릿코드")
    @Column(name = "template_code", length = 50, nullable = false)
    @Size(max = 50, message = "templateCode 는 50자 이내여야 합니다.")
    private String templateCode;

    @Comment("템플릿명")
    @Column(name = "template_nm", length = 100, nullable = false)
    @Size(max = 100, message = "templateNm 는 100자 이내여야 합니다.")
    private String templateNm;

    @Comment("제목 (이메일용)")
    @Column(name = "template_subject", length = 200)
    @Size(max = 100, message = "templateSubject 는 100자 이내여야 합니다.")
    private String templateSubject;

    @Comment("내용 (치환변수 포함)")
    @Column(name = "template_content", columnDefinition = "TEXT")
    @Size(max = 500000, message = "templateContent 는 500,000자 이내여야 합니다.")
    private String templateContent;

    @Comment("치환변수 예시 (JSON)")
    @Column(name = "sample_params", columnDefinition = "TEXT")
    @Size(max = 500000, message = "sampleParams 는 500,000자 이내여야 합니다.")
    private String sampleParams;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

}
