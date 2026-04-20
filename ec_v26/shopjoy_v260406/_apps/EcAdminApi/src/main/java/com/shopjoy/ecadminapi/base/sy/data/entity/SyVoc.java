package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_voc", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 고객의 소리(VOC) 엔티티
public class SyVoc {

    @Id
    @Column(name = "voc_id", length = 21, nullable = false)
    private String vocId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "voc_master_cd", length = 20, nullable = false)
    private String vocMasterCd;

    @Column(name = "voc_detail_cd", length = 20, nullable = false)
    private String vocDetailCd;

    @Column(name = "voc_nm", length = 100, nullable = false)
    private String vocNm;

    @Lob
    @Column(name = "voc_content", columnDefinition = "TEXT")
    private String vocContent;

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