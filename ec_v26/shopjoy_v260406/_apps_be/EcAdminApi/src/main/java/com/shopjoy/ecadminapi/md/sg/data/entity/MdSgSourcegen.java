package com.shopjoy.ecadminapi.md.sg.data.entity;

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
@Table(name = "md_sg_sourcegen", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("소스젠 DDL 정의 — 프로젝트당 여러 테이블 DDL 보관")
public class MdSgSourcegen extends BaseEntity {

    @Id
    @Comment("소스젠ID (YYMMDDhhmmss+rand4)")
    @Column(name = "sourcegen_id", length = 21, nullable = false)
    @Size(max = 21, message = "sourcegenId 는 21자 이내여야 합니다.")
    private String sourcegenId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("프로젝트ID (md_sg_project.project_id)")
    @Column(name = "project_id", length = 21, nullable = false)
    @Size(max = 21, message = "projectId 는 21자 이내여야 합니다.")
    private String projectId;

    @Comment("탭 번호 (1~10)")
    @Column(name = "tab_no", nullable = false)
    private Integer tabNo;

    @Comment("CREATE TABLE 원문 DDL")
    @Column(name = "ddl_text", columnDefinition = "TEXT")
    private String ddlText;

    @Comment("스키마명 (DDL 파싱 자동 추출)")
    @Column(name = "schema_nm", length = 100)
    @Size(max = 100, message = "schemaNm 는 100자 이내여야 합니다.")
    private String schemaNm;

    @Comment("테이블명 (DDL 파싱 자동 추출)")
    @Column(name = "table_nm", length = 100)
    @Size(max = 100, message = "tableNm 는 100자 이내여야 합니다.")
    private String tableNm;

    @Comment("생성 클래스명 (테이블명 PascalCase 자동)")
    @Column(name = "class_nm", length = 100)
    @Size(max = 100, message = "classNm 는 100자 이내여야 합니다.")
    private String classNm;

    @Comment("REST 엔드포인트 경로 (테이블명 접두어 제거 자동)")
    @Column(name = "endpoint", length = 100)
    @Size(max = 100, message = "endpoint 는 100자 이내여야 합니다.")
    private String endpoint;

    @Comment("Swagger 태그 (미입력 시 class_nm 사용)")
    @Column(name = "swagger_tag", length = 100)
    @Size(max = 100, message = "swaggerTag 는 100자 이내여야 합니다.")
    private String swaggerTag;

    @Comment("서브 패키지 (basePackage 하위 폴더 — 테이블명 접두어 자동, 예: zz_exam1 -> zz)")
    @Column(name = "sub_package", length = 50)
    @Size(max = 50, message = "subPackage 는 50자 이내여야 합니다.")
    private String subPackage;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;
}
