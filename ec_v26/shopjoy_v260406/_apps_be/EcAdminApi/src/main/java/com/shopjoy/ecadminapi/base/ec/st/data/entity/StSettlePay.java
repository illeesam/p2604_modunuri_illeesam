package com.shopjoy.ecadminapi.base.ec.st.data.entity;

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
@Table(name = "st_settle_pay", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 지급 엔티티
@Comment("정산지급")
public class StSettlePay extends BaseEntity {

    @Id
    @Comment("정산지급ID (YYMMDDhhmmss+rand4)")
    @Column(name = "settle_pay_id", length = 21, nullable = false)
    @Size(max = 21, message = "settlePayId 는 21자 이내여야 합니다.")
    private String settlePayId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    @Size(max = 21, message = "settleId 는 21자 이내여야 합니다.")
    private String settleId;


    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("지급금액")
    @Column(name = "pay_amt", nullable = false)
    private Long payAmt;

    @Comment("지급수단 (코드: PAY_METHOD)")
    @Column(name = "pay_method_cd", length = 20)
    @Size(max = 20, message = "payMethodCd 는 20자 이내여야 합니다.")
    private String payMethodCd;

    @Comment("은행명")
    @Column(name = "bank_nm", length = 50)
    @Size(max = 50, message = "bankNm 는 50자 이내여야 합니다.")
    private String bankNm;

    @Comment("계좌번호")
    @Column(name = "bank_account", length = 50)
    @Size(max = 50, message = "bankAccount 는 50자 이내여야 합니다.")
    private String bankAccount;

    @Comment("예금주")
    @Column(name = "bank_holder", length = 50)
    @Size(max = 50, message = "bankHolder 는 50자 이내여야 합니다.")
    private String bankHolder;

    @Comment("지급상태 (코드: SETTLE_PAY_STATUS — PENDING/COMPLT/FAILED)")
    @Column(name = "pay_status_cd", length = 20)
    @Size(max = 20, message = "payStatusCd 는 20자 이내여야 합니다.")
    private String payStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "pay_status_cd_before", length = 20)
    @Size(max = 20, message = "payStatusCdBefore 는 20자 이내여야 합니다.")
    private String payStatusCdBefore;

    @Comment("실지급 일시")
    @Column(name = "pay_date")
    private LocalDateTime payDate;

    @Comment("지급처리자 (sy_user.user_id)")
    @Column(name = "pay_by", length = 20)
    @Size(max = 20, message = "payBy 는 20자 이내여야 합니다.")
    private String payBy;

    @Comment("메모")
    @Column(name = "settle_pay_memo", columnDefinition = "TEXT")
    @Size(max = 500000, message = "settlePayMemo 는 500,000자 이내여야 합니다.")
    private String settlePayMemo;

}
