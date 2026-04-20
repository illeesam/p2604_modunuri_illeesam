package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 태그 엔티티
public class PdTag {

    @Id
    @Column(name = "tag_id", length = 21, nullable = false)
    private String tagId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "tag_nm", length = 100, nullable = false)
    private String tagNm;

    @Column(name = "tag_desc", length = 300)
    private String tagDesc;

    @Column(name = "use_count")
    private Integer useCount;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}