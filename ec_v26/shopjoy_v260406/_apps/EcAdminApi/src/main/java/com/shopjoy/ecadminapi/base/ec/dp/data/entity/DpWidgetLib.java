package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "dp_widget_lib", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 위젯 라이브러리 엔티티
public class DpWidgetLib extends BaseEntity {

    @Id
    @Column(name = "widget_lib_id", length = 21, nullable = false)
    private String widgetLibId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "widget_code", length = 50, nullable = false)
    private String widgetCode;

    @Column(name = "widget_nm", length = 100, nullable = false)
    private String widgetNm;

    @Column(name = "widget_type_cd", length = 30, nullable = false)
    private String widgetTypeCd;

    @Column(name = "widget_lib_desc", columnDefinition = "TEXT")
    private String widgetLibDesc;

    @Column(name = "disp_path", length = 500)
    private String dispPath;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "template_html", columnDefinition = "TEXT")
    private String templateHtml;

    @Column(name = "config_schema", columnDefinition = "TEXT")
    private String configSchema;

    @Column(name = "is_system", length = 1)
    private String isSystem;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
