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
@Table(name = "md_sg_project", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("소스젠 프로젝트 마스터 — DDL 묶음 단위")
public class MdSgProject extends BaseEntity {

    @Id
    @Comment("프로젝트ID (YYMMDDhhmmss+rand4)")
    @Column(name = "project_id", length = 21, nullable = false)
    @Size(max = 21, message = "projectId 는 21자 이내여야 합니다.")
    private String projectId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("작성 회원ID (mb_member.member_id, NULL=관리자 작성)")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("프로젝트명")
    @Column(name = "project_nm", length = 200, nullable = false)
    @Size(max = 200, message = "projectNm 는 200자 이내여야 합니다.")
    private String projectNm;

    @Comment("프로젝트 설명")
    @Column(name = "project_desc", length = 500)
    @Size(max = 500, message = "projectDesc 는 500자 이내여야 합니다.")
    private String projectDesc;

    @Comment("Base Package (예: com.exam.app) — 전체 DDL 탭 공유")
    @Column(name = "base_package", length = 200)
    @Size(max = 200, message = "basePackage 는 200자 이내여야 합니다.")
    private String basePackage;

    @Comment("DB 유형 — SG_DB_TYPE_CD {POSTGRESQL, ORACLE}")
    @Column(name = "db_type_cd", length = 20)
    @Size(max = 20, message = "dbTypeCd 는 20자 이내여야 합니다.")
    private String dbTypeCd;

    @Comment("등록된 DDL 탭 수 (md_sg_sourcegen 집계 캐시)")
    @Column(name = "ddl_count")
    private Integer ddlCount;

    @Comment("마지막 소스 생성 일시")
    @Column(name = "last_gen_date")
    private LocalDateTime lastGenDate;

    @Comment("마지막 생성 파일 수")
    @Column(name = "last_file_count")
    private Integer lastFileCount;

    @Comment("대표이미지 URL (미첨부 시 저장할 때 DDL 정보로 자동 생성해 채움)")
    @Column(name = "thumbnail_url", length = 500)
    @Size(max = 500, message = "thumbnailUrl 는 500자 이내여야 합니다.")
    private String thumbnailUrl;

    @Comment("대표이미지 첨부ID (sy_attach.attach_id)")
    @Column(name = "thumbnail_attach_id", length = 21)
    @Size(max = 21, message = "thumbnailAttachId 는 21자 이내여야 합니다.")
    private String thumbnailAttachId;

    @Comment("상태 — SG_PROJECT_STATUS_CD {DRAFT:작성중, DONE:생성완료}")
    @Column(name = "project_status_cd", length = 20)
    @Size(max = 20, message = "projectStatusCd 는 20자 이내여야 합니다.")
    private String projectStatusCd;

    @Comment("사용여부 Y/N (삭제 대체 플래그)")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;
}
