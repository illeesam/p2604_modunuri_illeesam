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
@Table(name = "cm_dashboard_item_data", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("대시보드 차트 패널 집계 데이터")
public class CmDashboardItemData extends BaseEntity {

    @Id
    @Comment("데이터ID")
    @Column(name = "item_data_id", length = 21, nullable = false)
    private String itemDataId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("패널ID FK")
    @Column(name = "dashboard_item_id", length = 21, nullable = false)
    private String dashboardItemId;

    @Comment("화면명 역정규화")
    @Column(name = "ui_nm", length = 100, nullable = false)
    private String uiNm;

    @Comment("패널키 역정규화")
    @Column(name = "item_key", length = 50, nullable = false)
    private String itemKey;

    @Comment("집계일자 (YYYYMMDD)")
    @Column(name = "yyyymmdd", length = 8, nullable = false)
    private String yyyymmdd;

    @Comment("부서ID")
    @Column(name = "dept_id", length = 21)
    private String deptId;

    @Comment("사용자ID")
    @Column(name = "user_id", length = 21)
    private String userId;

    @Comment("데이터 JSON")
    @Column(name = "data_json", columnDefinition = "TEXT")
    private String dataJson;

    @Comment("지표1명")
    @Column(name = "col1_nm", length = 100)
    private String col1Nm;

    @Comment("지표2명")
    @Column(name = "col2_nm", length = 100)
    private String col2Nm;

    @Comment("지표3명")
    @Column(name = "col3_nm", length = 100)
    private String col3Nm;

    @Comment("지표4명")
    @Column(name = "col4_nm", length = 100)
    private String col4Nm;

    @Comment("지표5명")
    @Column(name = "col5_nm", length = 100)
    private String col5Nm;

    @Comment("지표6명")
    @Column(name = "col6_nm", length = 100)
    private String col6Nm;

    @Comment("지표7명")
    @Column(name = "col7_nm", length = 100)
    private String col7Nm;

    @Comment("지표8명")
    @Column(name = "col8_nm", length = 100)
    private String col8Nm;

    @Comment("지표9명")
    @Column(name = "col9_nm", length = 100)
    private String col9Nm;

    @Comment("지표1값")
    @Column(name = "col1_num")
    private Double col1Num;

    @Comment("지표2값")
    @Column(name = "col2_num")
    private Double col2Num;

    @Comment("지표3값")
    @Column(name = "col3_num")
    private Double col3Num;

    @Comment("지표4값")
    @Column(name = "col4_num")
    private Double col4Num;

    @Comment("지표5값")
    @Column(name = "col5_num")
    private Double col5Num;

    @Comment("지표6값")
    @Column(name = "col6_num")
    private Double col6Num;

    @Comment("지표7값")
    @Column(name = "col7_num")
    private Double col7Num;

    @Comment("지표8값")
    @Column(name = "col8_num")
    private Double col8Num;

    @Comment("지표9값")
    @Column(name = "col9_num")
    private Double col9Num;
}
