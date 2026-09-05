package com.shopjoy.ecBeBo.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "odh_pay_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 결제 상태 이력 엔티티
@Comment("결제 상태 이력 (결제 상태 변경만 추적)")
public class OdhPayStatusHist extends BaseEntity {

    @Id
    @Comment("결제상태이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "pay_status_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "payStatusHistId 는 21자 이내여야 합니다.")
    private String payStatusHistId;


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
    @Column(name = "pay_status_cd", length = 20)
    @Size(max = 20, message = "payStatusCd 는 20자 이내여야 합니다.")
    private String payStatusCd;

    @Comment("상태 변경 사유")
    @Column(name = "status_reason", length = 300)
    @Size(max = 300, message = "statusReason 는 300자 이내여야 합니다.")
    private String statusReason;

    @Comment("변경 담당자 (sy_user.user_id, mb_member.member_id)")
    @Column(name = "chg_user_id", length = 21)
    @Size(max = 21, message = "chgUserId 는 21자 이내여야 합니다.")
    private String chgUserId;

    @Comment("변경 일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Comment("메모")
    @Column(name = "memo", length = 300)
    @Size(max = 300, message = "memo 는 300자 이내여야 합니다.")
    private String memo;

}
