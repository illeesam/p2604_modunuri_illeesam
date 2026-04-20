package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_path", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 경로(메뉴/URL) 엔티티
public class CmPath {

    @Id
    @Column(name = "biz_cd", length = 50, nullable = false)
    private String bizCd;

    @Column(name = "parent_path_id")
    private Long parentPathId;

    @Column(name = "path_label", length = 200, nullable = false)
    private String pathLabel;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "path_remark", length = 500)
    private String pathRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}