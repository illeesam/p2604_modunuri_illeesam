package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

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
    private String templateId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("템플릿유형 (코드: TEMPLATE_TYPE)")
    @Column(name = "template_type_cd", length = 20, nullable = false)
    private String templateTypeCd;

    @Comment("템플릿코드")
    @Column(name = "template_code", length = 50, nullable = false)
    private String templateCode;

    @Comment("템플릿명")
    @Column(name = "template_nm", length = 100, nullable = false)
    private String templateNm;

    @Comment("제목 (이메일용)")
    @Column(name = "template_subject", length = 200)
    private String templateSubject;

    @Comment("내용 (치환변수 포함)")
    @Column(name = "template_content", columnDefinition = "TEXT")
    private String templateContent;

    @Comment("치환변수 예시 (JSON)")
    @Column(name = "sample_params", columnDefinition = "TEXT")
    private String sampleParams;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    private String pathId;

}
