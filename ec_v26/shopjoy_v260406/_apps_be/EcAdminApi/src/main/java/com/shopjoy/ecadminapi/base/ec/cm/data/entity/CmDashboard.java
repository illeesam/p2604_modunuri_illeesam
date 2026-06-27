package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "cm_dashboard", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("대시보드 정의")
public class CmDashboard extends BaseEntity {

    @Id
    @Comment("대시보드ID")
    @Column(name = "dashboard_id", length = 21, nullable = false)
    private String dashboardId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("대시보드명")
    @Column(name = "dashboard_nm", length = 200, nullable = false)
    private String dashboardNm;

    @Comment("프론트 컴포넌트명 DashboardBoEc01 등")
    @Column(name = "ui_comp_nm", length = 100, nullable = false)
    private String uiCompNm;

    @Comment("그리드 열 수 기본 4")
    @Column(name = "layout_cols")
    private Integer layoutCols;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "remark", length = 500)
    private String remark;
}
