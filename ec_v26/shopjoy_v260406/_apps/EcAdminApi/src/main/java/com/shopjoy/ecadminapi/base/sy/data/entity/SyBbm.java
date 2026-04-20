package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_bbm", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 게시판 마스터 엔티티
public class SyBbm {

    @Id
    @Column(name = "bbm_id", length = 21, nullable = false)
    private String bbmId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "bbm_code", length = 50, nullable = false)
    private String bbmCode;

    @Column(name = "bbm_nm", length = 100, nullable = false)
    private String bbmNm;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

    @Column(name = "bbm_type_cd", length = 20)
    private String bbmTypeCd;

    @Column(name = "allow_comment", length = 1)
    private String allowComment;

    @Column(name = "allow_attach", length = 1)
    private String allowAttach;

    @Column(name = "allow_like", length = 1)
    private String allowLike;

    @Column(name = "content_type_cd", length = 20)
    private String contentTypeCd;

    @Column(name = "scope_type_cd", length = 20)
    private String scopeTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "bbm_remark", length = 300)
    private String bbmRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}