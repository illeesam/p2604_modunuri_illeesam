package com.shopjoy.ecBeBo.md.cb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;

@Entity
@Table(name = "md_cb_pattern_yarn", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("도안-실 매핑 (도안별 사용 실 목록)")
public class MdCbPatternYarn extends BaseEntity {

    @Id
    @Comment("도안실매핑ID (YYMMDDhhmmss+rand4)")
    @Column(name = "pattern_yarn_id", length = 21, nullable = false)
    @Size(max = 21, message = "patternYarnId 는 21자 이내여야 합니다.")
    private String patternYarnId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("도안ID (md_cb_pattern.pattern_id)")
    @Column(name = "pattern_id", length = 21, nullable = false)
    @Size(max = 21, message = "patternId 는 21자 이내여야 합니다.")
    private String patternId;

    @Comment("실ID (md_cb_yarn.yarn_id)")
    @Column(name = "yarn_id", length = 21, nullable = false)
    @Size(max = 21, message = "yarnId 는 21자 이내여야 합니다.")
    private String yarnId;

    @Comment("사용 설명 (예: 메인 색상, 포인트 색상)")
    @Column(name = "usage_desc", length = 200)
    @Size(max = 200, message = "usageDesc 는 200자 이내여야 합니다.")
    private String usageDesc;
}
