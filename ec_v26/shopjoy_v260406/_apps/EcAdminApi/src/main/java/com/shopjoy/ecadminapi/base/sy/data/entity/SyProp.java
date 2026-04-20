package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_prop", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 시스템 속성 엔티티
public class SyProp {

    @Id
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "disp_path", length = 200, nullable = false)
    private String dispPath;

    @Column(name = "prop_key", length = 100, nullable = false)
    private String propKey;

    @Lob
    @Column(name = "prop_value", columnDefinition = "TEXT")
    private String propValue;

    @Column(name = "prop_label", length = 200, nullable = false)
    private String propLabel;

    @Column(name = "prop_type_cd", length = 20)
    private String propTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "prop_remark", length = 500)
    private String propRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}