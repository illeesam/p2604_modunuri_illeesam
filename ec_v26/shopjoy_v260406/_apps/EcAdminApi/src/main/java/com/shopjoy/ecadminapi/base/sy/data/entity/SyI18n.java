package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_i18n", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 다국어 엔티티
public class SyI18n {

    @Id
    @Column(name = "i18n_id", length = 20, nullable = false)
    private String i18nId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "i18n_key", length = 200, nullable = false)
    private String i18nKey;

    @Column(name = "i18n_desc", length = 200)
    private String i18nDesc;

    @Column(name = "i18n_scope_cd", length = 20)
    private String i18nScopeCd;

    @Column(name = "i18n_category", length = 50)
    private String i18nCategory;

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