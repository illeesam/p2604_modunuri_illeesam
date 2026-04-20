package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_code_grp", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 공통 코드 그룹 엔티티
public class SyCodeGrp {

    @Id
    @Column(name = "code_grp_id", length = 21, nullable = false)
    private String codeGrpId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "code_grp", length = 50, nullable = false)
    private String codeGrp;

    @Column(name = "grp_nm", length = 100, nullable = false)
    private String grpNm;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

    @Column(name = "code_grp_desc", length = 300)
    private String codeGrpDesc;

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