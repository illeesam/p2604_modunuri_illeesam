package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

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
@Table(name = "pm_save_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 사용 이력 엔티티
@Comment("적립금 사용 이력 (주문 시 사용된 적립금 건별 기록)")
public class PmSaveUsage extends BaseEntity {

    @Id
    @Comment("적립사용ID (YYMMDDhhmmss+rand4)")
    @Column(name = "save_usage_id", length = 21, nullable = false)
    @Size(max = 21, message = "saveUsageId 는 21자 이내여야 합니다.")
    private String saveUsageId;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("주문상품ID (od_order_item.order_item_id, 상품별 사용 시)")
    @Column(name = "order_item_id", length = 21)
    @Size(max = 21, message = "orderItemId 는 21자 이내여야 합니다.")
    private String orderItemId;

    @Comment("상품ID (pd_prod.prod_id, 사용 상품)")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("사용 적립금액")
    @Column(name = "use_amt", nullable = false)
    private Long useAmt;

    @Comment("사용 후 잔액")
    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Comment("사용일시")
    @Column(name = "used_date")
    private LocalDateTime usedDate;

}
