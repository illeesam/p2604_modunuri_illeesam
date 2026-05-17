package com.shopjoy.ecadminapi.base.ec.dp.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "dp_ui", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 전시 UI 엔티티
@Comment("디스플레이 UI (최상위 화면 정의)")
public class DpUi extends BaseEntity {

    @Id
    @Comment("UIID (YYMMDDhhmmss+rand4)")
    @Column(name = "ui_id", length = 21, nullable = false)
    private String uiId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("UI코드 (예: MOBILE_MAIN, PC_MAIN)")
    @Column(name = "ui_cd", length = 50, nullable = false)
    private String uiCd;

    @Comment("UI명")
    @Column(name = "ui_nm", length = 100, nullable = false)
    private String uiNm;

    @Comment("UI설명")
    @Column(name = "ui_desc", length = 300)
    private String uiDesc;

    @Comment("디바이스유형 (코드: DEVICE_TYPE)")
    @Column(name = "device_type_cd", length = 30)
    private String deviceTypeCd;

    @Comment("페이지경로")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("사용시작일")
    @Column(name = "use_start_date")
    private LocalDate useStartDate;

    @Comment("사용종료일")
    @Column(name = "use_end_date")
    private LocalDate useEndDate;

}
