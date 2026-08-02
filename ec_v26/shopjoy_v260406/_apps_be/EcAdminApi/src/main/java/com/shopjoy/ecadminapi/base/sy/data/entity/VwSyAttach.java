package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

/**
 * vw_sy_attach 뷰 엔티티 (READ-ONLY)
 * sy_attach + sy_attach_grp INNER JOIN 뷰
 * — 첨부파일 조회 시 그룹 정보(attach_grp_nm, attach_grp_code 등)를 별도 JOIN 없이 바로 조회
 */
@Entity
@Immutable
@Table(name = "vw_sy_attach", schema = "shopjoy_2604")
@Getter
@NoArgsConstructor
public class VwSyAttach {

    // ── sy_attach 컬럼 ──────────────────────────────────────────────────────

    @Id
    @Column(name = "attach_id", length = 21, nullable = false)
    private String attachId;


    @Column(name = "attach_grp_id", length = 21, nullable = false)
    private String attachGrpId;

    @Column(name = "file_nm", length = 300, nullable = false)
    private String fileNm;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_ext", length = 20)
    private String fileExt;

    @Column(name = "mime_type_cd", length = 100)
    private String mimeTypeCd;

    @Column(name = "stored_nm", length = 300)
    private String storedNm;

    @Column(name = "storage_type", length = 50)
    private String storageType;

    @Column(name = "storage_path", length = 500)
    private String storagePath;

    @Column(name = "attach_url", length = 500)
    private String attachUrl;

    @Column(name = "cdn_host", length = 100)
    private String cdnHost;

    @Column(name = "cdn_img_url", length = 500)
    private String cdnImgUrl;

    @Column(name = "cdn_thumb_url", length = 500)
    private String cdnThumbUrl;

    @Column(name = "thumb_file_nm", length = 300)
    private String thumbFileNm;

    @Column(name = "thumb_stored_nm", length = 300)
    private String thumbStoredNm;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "thumb_cdn_url", length = 500)
    private String thumbCdnUrl;

    @Column(name = "thumb_generated_yn", length = 1)
    private String thumbGeneratedYn;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "attach_memo", length = 300)
    private String attachMemo;

    @Column(name = "physical_path", length = 700)
    private String physicalPath;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    // ── sy_attach_grp 컬럼 (JOIN 추가분) ───────────────────────────────────

    @Column(name = "attach_grp_code", length = 50)
    private String attachGrpCode;

    @Column(name = "attach_grp_nm", length = 100)
    private String attachGrpNm;

    @Column(name = "file_ext_allow", length = 200)
    private String fileExtAllow;

    @Column(name = "max_file_size")
    private Long maxFileSize;

    @Column(name = "max_file_count")
    private Integer maxFileCount;

    /** sy_attach_grp.storage_path */
    @Column(name = "grp_storage_path", length = 300)
    private String grpStoragePath;

    /** sy_attach_grp.use_yn */
    @Column(name = "grp_use_yn", length = 1)
    private String grpUseYn;

    /** sy_attach_grp.sort_ord */
    @Column(name = "grp_sort_ord")
    private Integer grpSortOrd;
}
