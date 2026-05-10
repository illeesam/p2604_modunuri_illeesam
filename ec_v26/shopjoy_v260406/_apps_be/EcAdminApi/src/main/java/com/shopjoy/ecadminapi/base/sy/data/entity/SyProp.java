package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_prop", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 시스템 속성 엔티티
public class SyProp extends BaseEntity {

    @Id
    @Column(name = "prop_id", length = 21)
    private String propId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "path_id", length = 21)
    private String pathId;

    @Column(name = "prop_key", length = 100, nullable = false)
    private String propKey;

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

}
