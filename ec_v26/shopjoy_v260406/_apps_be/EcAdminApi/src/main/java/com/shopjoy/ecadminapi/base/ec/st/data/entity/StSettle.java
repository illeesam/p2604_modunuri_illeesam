package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "st_settle", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 엔티티
@Comment("정산 마스터 (업체별 월정산)")
public class StSettle extends BaseEntity {

    @Id
    @Comment("정산ID (YYMMDDhhmmss+rand4)")
    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Comment("정산년월 (YYYYMM)")
    @Column(name = "settle_ym", length = 6, nullable = false)
    private String settleYm;

    @Comment("정산 기준 시작일")
    @Column(name = "settle_start_date", nullable = false)
    private LocalDateTime settleStartDate;

    @Comment("정산 기준 종료일")
    @Column(name = "settle_end_date", nullable = false)
    private LocalDateTime settleEndDate;

    @Comment("총 주문금액 (당월 신규 주문 귀속)")
    @Column(name = "total_order_amt")
    private Long totalOrderAmt;

    @Comment("총 환불금액 (환불 확정월 귀속 — 타월 주문 환불 포함)")
    @Column(name = "total_return_amt")
    private Long totalReturnAmt;

    @Comment("환불 건수 (st_settle_raw.raw_type_cd=CLAIM 집계)")
    @Column(name = "total_claim_cnt")
    private Integer totalClaimCnt;

    @Comment("총 할인금액")
    @Column(name = "total_discnt_amt")
    private Long totalDiscntAmt;

    @Comment("적용 수수료율 (%)")
    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Comment("수수료금액")
    @Column(name = "commission_amt")
    private Long commissionAmt;

    @Comment("기본 정산금액")
    @Column(name = "settle_amt")
    private Long settleAmt;

    @Comment("정산조정 합계")
    @Column(name = "adj_amt")
    private Long adjAmt;

    @Comment("기타조정 합계")
    @Column(name = "etc_adj_amt")
    private Long etcAdjAmt;

    @Comment("최종 정산금액")
    @Column(name = "final_settle_amt")
    private Long finalSettleAmt;

    @Comment("상태 (코드: SETTLE_STATUS — DRAFT/CONFIRMED/CLOSED/PAID)")
    @Column(name = "settle_status_cd", length = 20)
    private String settleStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "settle_status_cd_before", length = 20)
    private String settleStatusCdBefore;

    @Comment("정산 메모")
    @Column(name = "settle_memo", columnDefinition = "TEXT")
    private String settleMemo;

}
