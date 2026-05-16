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
    private String settlePayId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Comment("지급금액")
    @Column(name = "pay_amt", nullable = false)
    private Long payAmt;

    @Comment("지급수단 (코드: PAY_METHOD_CD)")
    @Column(name = "pay_method_cd", length = 20)
    private String payMethodCd;

    @Comment("은행명")
    @Column(name = "bank_nm", length = 50)
    private String bankNm;

    @Comment("계좌번호")
    @Column(name = "bank_account", length = 50)
    private String bankAccount;

    @Comment("예금주")
    @Column(name = "bank_holder", length = 50)
    private String bankHolder;

    @Comment("지급상태 (코드: SETTLE_PAY_STATUS — PENDING/COMPLT/FAILED)")
    @Column(name = "pay_status_cd", length = 20)
    private String payStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "pay_status_cd_before", length = 20)
    private String payStatusCdBefore;

    @Comment("실지급 일시")
    @Column(name = "pay_date")
    private LocalDateTime payDate;

    @Comment("지급처리자 (sy_user.user_id)")
    @Column(name = "pay_by", length = 20)
    private String payBy;

    @Comment("메모")
    @Column(name = "settle_pay_memo", columnDefinition = "TEXT")
    private String settlePayMemo;

}
