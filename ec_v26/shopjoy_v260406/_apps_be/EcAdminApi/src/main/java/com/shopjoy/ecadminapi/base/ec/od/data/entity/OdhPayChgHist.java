package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "odh_pay_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 결제 변경 이력 엔티티
@Comment("결제 변경 이력 (모든 결제 변경사항 추적)")
public class OdhPayChgHist extends BaseEntity {

    @Id
    @Comment("결제변경이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "pay_chg_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "payChgHistId 는 21자 이내여야 합니다.")
    private String payChgHistId;


    @Comment("결제ID (od_pay.)")
    @Column(name = "pay_id", length = 21, nullable = false)
    @Size(max = 21, message = "payId 는 21자 이내여야 합니다.")
    private String payId;

    @Comment("주문ID (od_order.)")
    @Column(name = "order_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("변경 전 결제상태 (코드: PAY_STATUS)")
    @Column(name = "pay_status_cd_before", length = 20)
    @Size(max = 20, message = "payStatusCdBefore 는 20자 이내여야 합니다.")
    private String payStatusCdBefore;

    @Comment("변경 후 결제상태 (코드: PAY_STATUS)")
    @Column(name = "pay_status_cd_after", length = 20)
    @Size(max = 20, message = "payStatusCdAfter 는 20자 이내여야 합니다.")
    private String payStatusCdAfter;

    @Comment("변경유형 (코드: PAYMENT_CHG_TYPE)")
    @Column(name = "chg_type_cd", length = 30, nullable = false)
    @Size(max = 30, message = "chgTypeCd 는 30자 이내여야 합니다.")
    private String chgTypeCd;

    @Comment("변경 사유 (예: PG 승인 완료, 수동 환불 등)")
    @Column(name = "chg_reason", length = 300)
    @Size(max = 100, message = "chgReason 는 100자 이내여야 합니다.")
    private String chgReason;

    @Comment("PG 응답 데이터 (JSON)")
    @Column(name = "pg_response", columnDefinition = "TEXT")
    @Size(max = 50000, message = "pgResponse 는 50000자 이내여야 합니다.")
    private String pgResponse;

    @Comment("환불 금액 (환불 시만)")
    @Column(name = "refund_amt")
    private Long refundAmt;

    @Comment("환불 거래ID (환불 시 PG로부터 받은 ID)")
    @Column(name = "refund_pg_tid", length = 100)
    @Size(max = 100, message = "refundPgTid 는 100자 이내여야 합니다.")
    private String refundPgTid;

    @Comment("변경 담당자 (sy_user.user_id, mb_member.member_id)")
    @Column(name = "chg_user_id", length = 21)
    @Size(max = 21, message = "chgUserId 는 21자 이내여야 합니다.")
    private String chgUserId;

    @Comment("변경 일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Comment("메모")
    @Column(name = "memo", length = 300)
    @Size(max = 100, message = "memo 는 100자 이내여야 합니다.")
    private String memo;

}
