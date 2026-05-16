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
@Table(name = "dp_widget", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 위젯 엔티티
@Comment("디스플레이 위젯 (라이브러리 참조 또는 직접 생성)")
public class DpWidget extends BaseEntity {

    @Id
    @Comment("위젯ID (YYMMDDhhmmss+rand4)")
    @Column(name = "widget_id", length = 21, nullable = false)
    private String widgetId;

    @Comment("위젯라이브러리ID (dp_widget_lib.widget_lib_id, 참조 선택사항)")
    @Column(name = "widget_lib_id", length = 21)
    private String widgetLibId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("위젯명")
    @Column(name = "widget_nm", length = 100, nullable = false)
    private String widgetNm;

    @Comment("위젯유형 (코드: WIDGET_TYPE)")
    @Column(name = "widget_type_cd", length = 30, nullable = false)
    private String widgetTypeCd;

    @Comment("위젯설명")
    @Column(name = "widget_desc", length = 300)
    private String widgetDesc;

    @Comment("위젯타이틀")
    @Column(name = "widget_title", length = 200)
    private String widgetTitle;

    @Comment("위젯내용 (HTML 에디터)")
    @Column(name = "widget_content", columnDefinition = "TEXT")
    private String widgetContent;

    @Comment("타이틀표시여부 (Y/N)")
    @Column(name = "title_show_yn", length = 1)
    private String titleShowYn;

    @Comment("위젯라이브러리참조여부 (Y/N)")
    @Column(name = "widget_lib_ref_yn", length = 1)
    private String widgetLibRefYn;

    @Comment("위젯추가설정 (JSON)")
    @Column(name = "widget_config_json", columnDefinition = "TEXT")
    private String widgetConfigJson;

    @Comment("미리보기 썸네일URL")
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("전시 환경 (^PROD^DEV^TEST^ 형식)")
    @Column(name = "disp_env", length = 50)
    private String dispEnv;

}
