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
@Table(name = "md_sg_download_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("소스젠 ZIP 다운로드 클릭 기록 — 파일 재보관 없이 로그만 남긴다")
public class MdSgDownloadHist extends BaseEntity {

    @Id
    @Comment("다운로드이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "download_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "downloadHistId 는 21자 이내여야 합니다.")
    private String downloadHistId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("프로젝트ID (md_sg_project.project_id) — 저장 전 신규 프로젝트에서 다운로드하면 NULL 가능")
    @Column(name = "project_id", length = 21)
    @Size(max = 21, message = "projectId 는 21자 이내여야 합니다.")
    private String projectId;

    @Comment("프로젝트명 스냅샷 (다운로드 시점 값)")
    @Column(name = "project_nm", length = 200)
    @Size(max = 200, message = "projectNm 는 200자 이내여야 합니다.")
    private String projectNm;

    @Comment("Base Package 스냅샷")
    @Column(name = "base_package", length = 200)
    @Size(max = 200, message = "basePackage 는 200자 이내여야 합니다.")
    private String basePackage;

    @Comment("다운로드한 ZIP 파일명 스냅샷")
    @Column(name = "zip_file_nm", length = 300)
    @Size(max = 300, message = "zipFileNm 는 300자 이내여야 합니다.")
    private String zipFileNm;

    @Comment("다운로드 시점 DDL 탭 수")
    @Column(name = "ddl_count")
    private Integer ddlCount;

    @Comment("다운로드 시점 생성 파일 수")
    @Column(name = "file_count")
    private Integer fileCount;
}
