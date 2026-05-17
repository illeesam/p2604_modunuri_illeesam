package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "dp_widget_lib", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 위젯 라이브러리 엔티티
@Comment("디스플레이 위젯 라이브러리")
public class DpWidgetLib extends BaseEntity {

    @Id
    @Comment("위젯라이브러리ID (YYMMDDhhmmss+rand4)")
    @Column(name = "widget_lib_id", length = 21, nullable = false)
    private String widgetLibId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("위젯코드")
    @Column(name = "widget_code", length = 50, nullable = false)
    private String widgetCode;

    @Comment("위젯명")
    @Column(name = "widget_nm", length = 100, nullable = false)
    private String widgetNm;

    @Comment("위젯유형 (코드: WIDGET_TYPE — BANNER/PRODUCT/CATEGORY/HTML/SLIDER)")
    @Column(name = "widget_type_cd", length = 30, nullable = false)
    private String widgetTypeCd;

    @Comment("위젯라이브러리설명")
    @Column(name = "widget_lib_desc", columnDefinition = "TEXT")
    private String widgetLibDesc;

    @Comment("점(.) 구분 표시경로")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("미리보기 썸네일URL")
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Comment("위젯내용 (HTML 에디터, 3개 테이블 통일)")
    @Column(name = "widget_content", columnDefinition = "TEXT")
    private String widgetContent;

    @Comment("위젯설정 (JSON, 3개 테이블 통일)")
    @Column(name = "widget_config_json", columnDefinition = "TEXT")
    private String widgetConfigJson;

    @Comment("시스템기본위젯 Y/N")
    @Column(name = "is_system", length = 1)
    private String isSystem;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
