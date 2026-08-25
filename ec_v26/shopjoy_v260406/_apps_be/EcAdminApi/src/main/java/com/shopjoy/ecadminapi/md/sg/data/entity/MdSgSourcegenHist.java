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

import java.time.LocalDateTime;

@Entity
@Table(name = "md_sg_sourcegen_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("소스젠 생성 이력 — 생성 결과 ZIP 을 첨부(sy_attach)로 보관")
public class MdSgSourcegenHist extends BaseEntity {

    @Id
    @Comment("소스젠 생성이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "sourcegen_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "sourcegenHistId 는 21자 이내여야 합니다.")
    private String sourcegenHistId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("프로젝트ID (md_sg_project.project_id)")
    @Column(name = "project_id", length = 21, nullable = false)
    @Size(max = 21, message = "projectId 는 21자 이내여야 합니다.")
    private String projectId;

    @Comment("생성 일시")
    @Column(name = "gen_date")
    private LocalDateTime genDate;

    @Comment("이번 생성에 포함된 DDL 탭 수")
    @Column(name = "ddl_count")
    private Integer ddlCount;

    @Comment("생성된 소스 파일 수")
    @Column(name = "file_count")
    private Integer fileCount;

    @Comment("생성결과 ZIP 첨부ID (sy_attach.attach_id)")
    @Column(name = "attach_id", length = 21)
    @Size(max = 21, message = "attachId 는 21자 이내여야 합니다.")
    private String attachId;

    @Comment("ZIP 파일명")
    @Column(name = "zip_file_nm", length = 300)
    @Size(max = 300, message = "zipFileNm 는 300자 이내여야 합니다.")
    private String zipFileNm;

    @Comment("ZIP 파일 크기(byte)")
    @Column(name = "zip_file_size")
    private Long zipFileSize;

    @Comment("ZIP 다운로드 URL (sy_attach.cdn_img_url 사본)")
    @Column(name = "zip_url", length = 500)
    @Size(max = 500, message = "zipUrl 는 500자 이내여야 합니다.")
    private String zipUrl;

    @Comment("생성 메모")
    @Column(name = "gen_memo", length = 500)
    @Size(max = 500, message = "genMemo 는 500자 이내여야 합니다.")
    private String genMemo;

    @Comment("DDL 탭 스냅샷(JSON) — 이 생성 시점의 basePackage/dbTypeCd + 탭별 ddlText 등. [불러오기] 시 에디터에 복원 후 재생성하는 용도")
    @Column(name = "ddl_snapshot_json", columnDefinition = "TEXT")
    private String ddlSnapshotJson;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;
}
