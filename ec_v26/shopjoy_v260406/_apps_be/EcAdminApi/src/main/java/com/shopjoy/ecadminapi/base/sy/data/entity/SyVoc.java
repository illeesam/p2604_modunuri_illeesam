package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_voc", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 고객의 소리(VOC) 엔티티
public class SyVoc extends BaseEntity {

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

    @Column(name = "voc_content", columnDefinition = "TEXT")
    private String vocContent;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
