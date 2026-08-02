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

    @Comment("소유 사용자ID (개인화 대시보드, NULL=공용)")
    @Column(name = "owner_user_id", length = 21)
    private String ownerUserId;

    @Comment("공개여부 — PUBLIC:전체공개 / PRIVATE:비공개(소유자+공유대상) (NULL=PRIVATE)")
    @Column(name = "share_scope_cd", length = 10)
    private String shareScopeCd;

    @Comment("공유 부서ID 목록 (^구분 예: ^DEPT001^DEPT002^)")
    @Column(name = "share_dept_id", length = 2000)
    private String shareDeptId;

    @Comment("공유 사용자ID 목록 (^구분 예: ^US001^US002^)")
    @Column(name = "share_user_ids", length = 2000)
    private String shareUserIds;

    @Comment("공유대상 업체ID 멀티값 (^V1^V2^)")
    @Column(name = "share_vendor_ids", length = 1000)
    private String shareVendorIds;

    @Comment("비고")
    @Column(name = "remark", length = 500)
    private String remark;
}
