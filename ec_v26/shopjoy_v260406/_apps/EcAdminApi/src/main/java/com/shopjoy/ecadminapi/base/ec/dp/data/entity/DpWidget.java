package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "dp_widget", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 전시 위젯 엔티티
public class DpWidget {

    @Id
    @Column(name = "widget_id", length = 21, nullable = false)
    private String widgetId;

    @Column(name = "widget_lib_id", length = 21)
    private String widgetLibId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "widget_nm", length = 100, nullable = false)
    private String widgetNm;

    @Column(name = "widget_type_cd", length = 30, nullable = false)
    private String widgetTypeCd;

    @Column(name = "widget_desc", length = 300)
    private String widgetDesc;

    @Column(name = "widget_title", length = 200)
    private String widgetTitle;

    @Lob
    @Column(name = "widget_content", columnDefinition = "TEXT")
    private String widgetContent;

    @Column(name = "title_show_yn", length = 1)
    private String titleShowYn;

    @Column(name = "widget_lib_ref_yn", length = 1)
    private String widgetLibRefYn;

    @Lob
    @Column(name = "widget_config_json", columnDefinition = "TEXT")
    private String widgetConfigJson;

    @Column(name = "preview_img_url", length = 500)
    private String previewImgUrl;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "disp_env", length = 50)
    private String dispEnv;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}