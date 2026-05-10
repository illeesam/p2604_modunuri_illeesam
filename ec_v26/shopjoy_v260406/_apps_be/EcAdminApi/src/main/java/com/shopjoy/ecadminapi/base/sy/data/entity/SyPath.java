package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_path", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class SyPath extends BaseEntity {

    @Id
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Column(name = "biz_cd", length = 50, nullable = false)
    private String bizCd;

    @Column(name = "parent_path_id", length = 21)
    private String parentPathId;

    @Column(name = "path_label", length = 200, nullable = false)
    private String pathLabel;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "path_remark", length = 500)
    private String pathRemark;

}
