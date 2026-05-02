package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_bbm", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시판 마스터 엔티티
public class SyBbm extends BaseEntity {

    @Id
    @Column(name = "bbm_id", length = 21, nullable = false)
    private String bbmId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "bbm_code", length = 50, nullable = false)
    private String bbmCode;

    @Column(name = "bbm_nm", length = 100, nullable = false)
    private String bbmNm;

    @Column(name = "path_id", length = 21)
    private String pathId;

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

}
