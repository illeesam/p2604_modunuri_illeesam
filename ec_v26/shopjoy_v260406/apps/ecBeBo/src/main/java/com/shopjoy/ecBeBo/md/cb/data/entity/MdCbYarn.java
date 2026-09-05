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
@Table(name = "md_cb_yarn", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("코바늘 실 마스터")
public class MdCbYarn extends BaseEntity {

    @Id
    @Comment("실ID (YYMMDDhhmmss+rand4)")
    @Column(name = "yarn_id", length = 21, nullable = false)
    @Size(max = 21, message = "yarnId 는 21자 이내여야 합니다.")
    private String yarnId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("실 이름 (예: 코튼워시드 아이보리)")
    @Column(name = "yarn_nm", length = 100, nullable = false)
    @Size(max = 100, message = "yarnNm 는 100자 이내여야 합니다.")
    private String yarnNm;

    @Comment("실 색상 (#RRGGBB)")
    @Column(name = "color_hex", length = 7, nullable = false)
    @Size(max = 7, message = "colorHex 는 7자 이내여야 합니다.")
    private String colorHex;

    @Comment("실 굵기 (코드: CB_YARN_WEIGHT_CD)")
    @Column(name = "weight_cd", length = 20)
    @Size(max = 20, message = "weightCd 는 20자 이내여야 합니다.")
    private String weightCd;

    @Comment("실 브랜드명")
    @Column(name = "brand_nm", length = 100)
    @Size(max = 100, message = "brandNm 는 100자 이내여야 합니다.")
    private String brandNm;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;
}
