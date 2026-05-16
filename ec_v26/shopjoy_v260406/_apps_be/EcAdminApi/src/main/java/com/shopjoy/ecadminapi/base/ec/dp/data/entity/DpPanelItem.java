package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "dp_panel_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 패널 아이템 엔티티
@Comment("디스플레이 패널 항목 (위젯 인스턴스 - 참조 또는 직접 생성)")
public class DpPanelItem extends BaseEntity {

    @Id
    @Comment("패널항목ID (YYMMDDhhmmss+rand4)")
    @Column(name = "panel_item_id", length = 21, nullable = false)
    private String panelItemId;

    @Comment("패널ID (dp_panel.panel_id)")
    @Column(name = "panel_id", length = 21, nullable = false)
    private String panelId;

    @Comment("위젯라이브러리ID (dp_widget_lib.widget_lib_id, 선택사항)")
    @Column(name = "widget_lib_id", length = 21)
    private String widgetLibId;

    @Comment("위젯유형 (코드: WIDGET_TYPE)")
    @Column(name = "widget_type_cd", length = 30)
    private String widgetTypeCd;

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

    @Comment("콘텐츠유형 (WIDGET/HTML/TEXT/IMAGE 등)")
    @Column(name = "content_type_cd", length = 30)
    private String contentTypeCd;

    @Comment("항목정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("위젯설정 (JSON - 위젯별 특정 설정 또는 직접 생성 콘텐츠)")
    @Column(name = "widget_config_json", columnDefinition = "TEXT")
    private String widgetConfigJson;

    @Comment("공개대상 (코드: VISIBILITY_TARGET, ^CODE^CODE^ 형식)")
    @Column(name = "visibility_targets", length = 200)
    private String visibilityTargets;

    @Comment("전시여부 (Y/N) - 배치로 자동 관리")
    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Comment("전시시작일")
    @Column(name = "disp_start_date")
    private LocalDate dispStartDate;

    @Comment("전시시작시간")
    @Column(name = "disp_start_time")
    private LocalTime dispStartTime;

    @Comment("전시종료일")
    @Column(name = "disp_end_date")
    private LocalDate dispEndDate;

    @Comment("전시종료시간")
    @Column(name = "disp_end_time")
    private LocalTime dispEndTime;

    @Comment("전시 환경 (^PROD^DEV^TEST^ 형식)")
    @Column(name = "disp_env", length = 50)
    private String dispEnv;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
