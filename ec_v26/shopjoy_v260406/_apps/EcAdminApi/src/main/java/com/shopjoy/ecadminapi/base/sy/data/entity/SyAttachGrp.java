package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_attach_grp", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 첨부파일 그룹 엔티티
public class SyAttachGrp {

    @Id
    @Column(name = "attach_grp_id", length = 21, nullable = false)
    private String attachGrpId;

    @Column(name = "attach_grp_code", length = 50, nullable = false)
    private String attachGrpCode;

    @Column(name = "attach_grp_nm", length = 100, nullable = false)
    private String attachGrpNm;

    @Column(name = "file_ext_allow", length = 200)
    private String fileExtAllow;

    @Column(name = "max_file_size")
    private Long maxFileSize;

    @Column(name = "max_file_count")
    private Integer maxFileCount;

    @Column(name = "storage_path", length = 300)
    private String storagePath;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "attach_grp_remark", length = 500)
    private String attachGrpRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}