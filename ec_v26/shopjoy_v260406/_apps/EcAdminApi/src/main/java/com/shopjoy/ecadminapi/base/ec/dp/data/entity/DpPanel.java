package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dp_panel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 전시 패널 엔티티
public class DpPanel {

    @Id
    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "panel_nm", length = 100, nullable = false)
    private String panelNm;

    @Column(name = "panel_type_cd", length = 30)
    private String panelTypeCd;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Column(name = "use_end_date")
    private LocalDate useEndDate;

    @Column(name = "disp_panel_status_cd", length = 20)
    private String dispPanelStatusCd;

    @Column(name = "disp_panel_status_cd_before", length = 20)
    private String dispPanelStatusCdBefore;

    @Lob
    @Column(name = "content_json", columnDefinition = "TEXT")
    private String contentJson;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}