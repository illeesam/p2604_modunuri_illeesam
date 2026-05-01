package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sy_template", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 템플릿 엔티티
public class SyTemplate {

    @Id
    @Column(name = "template_id", length = 21, nullable = false)
    private String templateId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "template_type_cd", length = 20, nullable = false)
    private String templateTypeCd;

    @Column(name = "template_code", length = 50, nullable = false)
    private String templateCode;

    @Column(name = "template_nm", length = 100, nullable = false)
    private String templateNm;

    @Column(name = "template_subject", length = 200)
    private String templateSubject;

    @Column(name = "template_content", columnDefinition = "TEXT")
    private String templateContent;

    @Column(name = "sample_params", columnDefinition = "TEXT")
    private String sampleParams;

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

    @Column(name = "disp_path", length = 200)
    private String dispPath;

}