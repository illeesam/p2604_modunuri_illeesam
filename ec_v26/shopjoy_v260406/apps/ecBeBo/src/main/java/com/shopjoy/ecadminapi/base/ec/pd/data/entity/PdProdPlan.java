package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pd_prod_plan", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("상품 판매계획 (시간대별 가격 스케줄)")
public class PdProdPlan extends BaseEntity {

    @Id
    @Comment("판매계획ID (YYMMDDhhmmss+rand4)")
    @Column(name = "prod_plan_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodPlanId 는 21자 이내여야 합니다.")
    private String prodPlanId;


    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("시작일시")
    @Column(name = "start_datetime")
    private LocalDateTime startDatetime;

    @Comment("종료일시")
    @Column(name = "end_datetime")
    private LocalDateTime endDatetime;

    @Comment("계획상태 (SCHEDULED/ACTIVE/ENDED/CANCELLED)")
    @Column(name = "plan_status_cd", length = 20)
    @Size(max = 20, message = "planStatusCd 는 20자 이내여야 합니다.")
    private String planStatusCd;

    @Comment("정가 (원)")
    @Column(name = "std_price")
    private Long stdPrice;

    @Comment("판매가 (원)")
    @Column(name = "sale_price")
    private Long salePrice;

    @Comment("매입가 (원)")
    @Column(name = "purchase_price")
    private Long purchasePrice;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;
}
