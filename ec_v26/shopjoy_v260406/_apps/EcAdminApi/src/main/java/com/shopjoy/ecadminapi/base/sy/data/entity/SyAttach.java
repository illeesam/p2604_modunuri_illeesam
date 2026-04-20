package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_attach", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 첨부파일 엔티티
public class SyAttach {

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

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "attach_memo", length = 300)
    private String attachMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}