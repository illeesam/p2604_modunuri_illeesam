package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_attach", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 첨부파일 엔티티
public class SyAttach extends BaseEntity {

    @Id
    @Column(name = "attach_id", length = 21, nullable = false)
    private String attachId;

    @Column(name = "site_id", length = 21)
    private String siteId;

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

    @Column(name = "attach_url", length = 500)
    private String attachUrl;

    @Column(name = "cdn_host", length = 100)
    private String cdnHost;

    @Column(name = "cdn_img_url", length = 500)
    private String cdnImgUrl;

    @Column(name = "cdn_thumb_url", length = 500)
    private String cdnThumbUrl;

    @Column(name = "storage_type", length = 50)
    private String storageType;

    @Column(name = "storage_path", length = 500)
    private String storagePath;

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

}
