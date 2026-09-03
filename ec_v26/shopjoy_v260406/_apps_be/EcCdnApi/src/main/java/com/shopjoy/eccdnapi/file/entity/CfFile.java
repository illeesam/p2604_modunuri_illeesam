package com.shopjoy.eccdnapi.file.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * cf_file 테이블 — EcCdnApi 가 자체 관리하는 파일 메타데이터(EcAdminApi 의 sy_attach 와는 별개,
 * 완전히 독립된 도메인). filePath/thumbnailPath/framePath 는 전부 storage-root 기준 상대경로다.
 */
@Entity
@Table(name = "cf_file")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CfFile {

    @Id
    @Column(name = "file_id", length = 20)
    private String fileId;

    @Column(name = "orig_file_nm", length = 300)
    private String origFileNm;

    /** storage-root 기준 상대경로 (예: 2026/09/03/F260903211500_ab12cd34.jpg) */
    @Column(name = "file_path", length = 300)
    private String filePath;

    /** 썸네일 상대경로 — 이미지는 요청 시에만, 동영상은 항상(프레임 기반) 생성. 없으면 null. */
    @Column(name = "thumbnail_path", length = 300)
    private String thumbnailPath;

    /** 동영상 첫 프레임(미리보기) 이미지 상대경로. 동영상이 아니면 null. */
    @Column(name = "frame_path", length = 300)
    private String framePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    /** IMAGE / VIDEO / FILE — com.shopjoy.eccdnapi.file.domain.CfMediaType 과 1:1 */
    @Column(name = "media_type_cd", length = 10)
    private String mediaTypeCd;

    /** 업로드를 요청한 내부 클라이언트(cf_client.client_id) — 현재는 사실상 항상 EcAdminApi 계정 */
    @Column(name = "uploader_client_id", length = 40)
    private String uploaderClientId;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
