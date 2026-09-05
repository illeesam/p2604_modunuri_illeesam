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
@Table(name = "sy_attach", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 첨부파일 엔티티
@Comment("첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리")
public class SyAttach extends BaseEntity {

    @Id
    @Comment("첨부파일 ID (YYMMDDhhmmss+random(4)+seq)")
    @Column(name = "attach_id", length = 21, nullable = false)
    @Size(max = 21, message = "attachId 는 21자 이내여야 합니다.")
    private String attachId;


    @Comment("관련 테이블명 (예: sy_notice) - 대상 엔티티에 직접 연계")
    @Column(name = "ref_table_nm", length = 100)
    @Size(max = 100, message = "refTableNm 는 100자 이내여야 합니다.")
    private String refTableNm;

    @Comment("관련 ID - ref_table_nm 과 조합해 대상 레코드를 식별")
    @Column(name = "ref_id", length = 21)
    @Size(max = 21, message = "refId 는 21자 이내여야 합니다.")
    private String refId;

    @Comment("원본 파일명")
    @Column(name = "file_nm", length = 300, nullable = false)
    @Size(max = 300, message = "fileNm 는 300자 이내여야 합니다.")
    private String fileNm;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_ext", length = 20)
    @Size(max = 20, message = "fileExt 는 20자 이내여야 합니다.")
    private String fileExt;

    @Column(name = "mime_type_cd", length = 100)
    @Size(max = 100, message = "mimeTypeCd 는 100자 이내여야 합니다.")
    private String mimeTypeCd;

    @Comment("저장된 파일명 (YYYYMMDD_hhmmss_seq_random.ext)")
    @Column(name = "stored_nm", length = 300)
    @Size(max = 300, message = "storedNm 는 300자 이내여야 합니다.")
    private String storedNm;

    @Column(name = "attach_url", length = 500)
    @Size(max = 500, message = "attachUrl 는 500자 이내여야 합니다.")
    private String attachUrl;

    @Column(name = "cdn_host", length = 100)
    @Size(max = 100, message = "cdnHost 는 100자 이내여야 합니다.")
    private String cdnHost;

    @Column(name = "cdn_img_url", length = 500)
    @Size(max = 500, message = "cdnImgUrl 는 500자 이내여야 합니다.")
    private String cdnImgUrl;

    @Column(name = "cdn_thumb_url", length = 500)
    @Size(max = 500, message = "cdnThumbUrl 는 500자 이내여야 합니다.")
    private String cdnThumbUrl;

    @Comment("스토리지 타입 (LOCAL/CDN/AWS_S3/NCP_OBS) — CDN=EcCdnApi 위임(2026-09-06 CfCdnApiClient 연동)")
    @Column(name = "storage_type_cd", length = 50)
    @Size(max = 50, message = "storageTypeCd 는 50자 이내여야 합니다.")
    private String storageTypeCd;

    @Comment("파일 저장 경로 (정책: /cdn/{업무명}/YYYY/YYYYMM/YYYYMMDD/{파일명}) — storage_type_cd=CDN 이면 예외적으로 EcCdnApi 의 fileId 를 담는다(삭제 시 필요, 2026-09-06)")
    @Column(name = "storage_path", length = 500)
    @Size(max = 500, message = "storagePath 는 500자 이내여야 합니다.")
    private String storagePath;

    @Comment("실제 물리 저장 전체 경로 (서버 절대경로, 예: src/main/resources/static/cdn/attch/NOTICE_ATTACH/2026/202605/20260503/파일명.png)")
    @Column(name = "physical_path", length = 700)
    @Size(max = 700, message = "physicalPath 는 700자 이내여야 합니다.")
    private String physicalPath;

    @Column(name = "thumb_file_nm", length = 300)
    @Size(max = 300, message = "thumbFileNm 는 300자 이내여야 합니다.")
    private String thumbFileNm;

    @Column(name = "thumb_stored_nm", length = 300)
    @Size(max = 300, message = "thumbStoredNm 는 300자 이내여야 합니다.")
    private String thumbStoredNm;

    @Column(name = "thumb_url", length = 500)
    @Size(max = 500, message = "thumbUrl 는 500자 이내여야 합니다.")
    private String thumbUrl;

    @Column(name = "thumb_cdn_url", length = 500)
    @Size(max = 500, message = "thumbCdnUrl 는 500자 이내여야 합니다.")
    private String thumbCdnUrl;

    @Comment("썸네일 생성 여부 (동영상은 필수 Y, 이미지는 선택)")
    @Column(name = "thumb_generated_yn", length = 1)
    @Size(max = 1, message = "thumbGeneratedYn 는 1자 이내여야 합니다.")
    private String thumbGeneratedYn;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "attach_memo", length = 300)
    @Size(max = 300, message = "attachMemo 는 300자 이내여야 합니다.")
    private String attachMemo;

}
