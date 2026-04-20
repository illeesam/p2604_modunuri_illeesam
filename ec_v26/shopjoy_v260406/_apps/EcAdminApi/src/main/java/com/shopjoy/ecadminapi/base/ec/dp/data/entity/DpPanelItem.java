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
@Table(name = "dp_panel_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 전시 패널 아이템 엔티티
public class DpPanelItem {

    @Id
    @Column(name = "panel_item_id", length = 21, nullable = false)
    private String panelItemId;

    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Column(name = "widget_lib_id", length = 21)
    private String widgetLibId;

    @Column(name = "widget_type_cd", length = 30)
    private String widgetTypeCd;

    @Column(name = "widget_title", length = 200)
    private String widgetTitle;

    @Lob
    @Column(name = "widget_content", columnDefinition = "TEXT")
    private String widgetContent;

    @Column(name = "title_show_yn", length = 1)
    private String titleShowYn;

    @Column(name = "widget_lib_ref_yn", length = 1)
    private String widgetLibRefYn;

    @Column(name = "content_type_cd", length = 30)
    private String contentTypeCd;

    @Column(name = "item_sort_ord")
    private Integer itemSortOrd;

    @Lob
    @Column(name = "widget_config_json", columnDefinition = "TEXT")
    private String widgetConfigJson;

    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Column(name = "disp_start_date")
    private LocalDate dispStartDate;

    @Column(name = "disp_end_date")
    private LocalDate dispEndDate;

    @Column(name = "disp_env", length = 50)
    private String dispEnv;

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