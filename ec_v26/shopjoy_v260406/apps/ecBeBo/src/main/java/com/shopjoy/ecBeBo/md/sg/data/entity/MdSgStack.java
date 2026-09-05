package com.shopjoy.ecBeBo.md.sg.data.entity;

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
@Table(name = "md_sg_stack", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("소스젠 언어/스택 카탈로그 — [소스 생성] 팝오버 체크리스트의 데이터 소스")
public class MdSgStack extends BaseEntity {

    @Id
    @Comment("스택ID (YYMMDDhhmmss+rand4)")
    @Column(name = "stack_id", length = 21, nullable = false)
    @Size(max = 21, message = "stackId 는 21자 이내여야 합니다.")
    private String stackId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("등록 사이트ID (sy_site.site_id)")
    @Column(name = "reg_site_id", length = 21, nullable = false)
    @Size(max = 21, message = "regSiteId 는 21자 이내여야 합니다.")
    private String regSiteId;

    @Comment("구획 — SG_STACK_CATEGORY_CD {BACKEND, FRONTEND, FULLSTACK, MOBILE, ETC}")
    @Column(name = "category_cd", length = 20, nullable = false)
    @Size(max = 20, message = "categoryCd 는 20자 이내여야 합니다.")
    private String categoryCd;

    @Comment("화면 표시명 (예: Backend (JPA))")
    @Column(name = "stack_nm", length = 100, nullable = false)
    @Size(max = 100, message = "stackNm 는 100자 이내여야 합니다.")
    private String stackNm;

    @Comment("생성 파일 경로 접두어 — gnGenerate() 결과 파일 키와 정확히 일치해야 함 (예: backend_jpa/)")
    @Column(name = "stack_prefix", length = 100, nullable = false)
    @Size(max = 100, message = "stackPrefix 는 100자 이내여야 합니다.")
    private String stackPrefix;

    @Comment("선택 가능 버전 목록 (콤마 구분, 예: v1,v2,v3)")
    @Column(name = "version_list", length = 200)
    @Size(max = 200, message = "versionList 는 200자 이내여야 합니다.")
    private String versionList;

    @Comment("기본 선택 버전")
    @Column(name = "default_version", length = 20)
    @Size(max = 20, message = "defaultVersion 는 20자 이내여야 합니다.")
    private String defaultVersion;

    @Comment("구획 내 정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N (N=팝오버 미노출)")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;
}
