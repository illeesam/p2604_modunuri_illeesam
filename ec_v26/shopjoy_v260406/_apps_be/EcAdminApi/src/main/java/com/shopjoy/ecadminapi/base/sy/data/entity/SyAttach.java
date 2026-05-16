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
@Table(name = "sy_attach", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 첨부파일 엔티티
@Comment("첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리")
public class SyAttach extends BaseEntity {

    @Id
    @Comment("첨부파일 ID (YYMMDDhhmmss+random(4)+seq)")
    @Column(name = "attach_id", length = 21, nullable = false)
    private String attachId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("파일 그룹 ID (sy_attach_grp과 연계)")
    @Column(name = "attach_grp_id", length = 21, nullable = false)
    private String attachGrpId;

    @Comment("원본 파일명")
    @Column(name = "file_nm", length = 300, nullable = false)
    private String fileNm;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_ext", length = 20)
    private String fileExt;

    @Column(name = "mime_type_cd", length = 100)
    private String mimeTypeCd;

    @Comment("저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)")
    @Column(name = "stored_nm", length = 300)
    private String storedNm;

    @Column(name = "attach_url", length = 500)
    private String attachUrl;

    @Column(name = "cdn_host", length = 100)
    private String cdnHost;

    @Column(name = "cdn_img_url", length = 500)
    private String cdnImgUrl;

    @Column(name = "cdn_thumb_url", length = 500)
    private String cdnThumbUrl;

    @Comment("스토리지 타입 (LOCAL/AWS_S3/NCP_OBS)")
    @Column(name = "storage_type", length = 50)
    private String storageType;

    @Comment("파일 저장 경로 (정책: /cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/{파일명})")
    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Comment("실제 물리 저장 전체 경로 (서버 절대경로, 예: src/main/resources/static/cdn/attch/NOTICE_ATTACH/2026/202605/20260503/파일명.png)")
    @Column(name = "physical_path", length = 700)
    private String physicalPath;

    @Column(name = "thumb_file_nm", length = 300)
    private String thumbFileNm;

    @Column(name = "thumb_stored_nm", length = 300)
    private String thumbStoredNm;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "thumb_cdn_url", length = 500)
    private String thumbCdnUrl;

    @Comment("썸네일 생성 여부 (동영상은 필수 Y, 이미지는 선택)")
    @Column(name = "thumb_generated_yn", length = 1)
    private String thumbGeneratedYn;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "attach_memo", length = 300)
    private String attachMemo;

}
