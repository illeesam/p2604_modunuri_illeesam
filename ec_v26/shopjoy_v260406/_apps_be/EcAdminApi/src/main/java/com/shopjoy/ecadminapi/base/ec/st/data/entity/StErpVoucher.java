package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "st_erp_voucher", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// ERP 전표 엔티티
@Comment("ERP 전표 마스터 (정산 → ERP 회계 전표)")
public class StErpVoucher extends BaseEntity {

    @Id
    @Comment("ERP전표ID (YYMMDDhhmmss+rand4)")
    @Column(name = "erp_voucher_id", length = 21, nullable = false)
    private String erpVoucherId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("업체ID")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21)
    private String settleId;

    @Comment("정산년월 (YYYYMM)")
    @Column(name = "settle_ym", length = 6)
    private String settleYm;

    @Comment("전표유형 (코드: ERP_VOUCHER_TYPE — SETTLE/RETURN/ADJ/PAY)")
    @Column(name = "erp_voucher_type_cd", length = 20, nullable = false)
    private String erpVoucherTypeCd;

    @Comment("전표상태 (코드: ERP_VOUCHER_STATUS — DRAFT/CONFIRMED/SENT/MATCHED/MISMATCH/ERROR)")
    @Column(name = "erp_voucher_status_cd", length = 20)
    private String erpVoucherStatusCd;

    @Comment("변경 전 전표상태")
    @Column(name = "erp_voucher_status_cd_before", length = 20)
    private String erpVoucherStatusCdBefore;

    @Comment("전표 기준일자")
    @Column(name = "voucher_date", nullable = false)
    private LocalDate voucherDate;

    @Comment("전표 적요")
    @Column(name = "erp_voucher_desc", length = 500)
    private String erpVoucherDesc;

    @Comment("차변 합계 (대변과 일치해야 전표 확정 가능)")
    @Column(name = "total_debit_amt")
    private Long totalDebitAmt;

    @Comment("대변 합계")
    @Column(name = "total_credit_amt")
    private Long totalCreditAmt;

    @Comment("ERP 전송일시")
    @Column(name = "erp_send_date")
    private LocalDateTime erpSendDate;

    @Comment("ERP 채번 전표번호 (전송 후 ERP에서 수신)")
    @Column(name = "erp_voucher_no", length = 50)
    private String erpVoucherNo;

    @Comment("ERP 처리 응답 메시지")
    @Column(name = "erp_res_msg", length = 500)
    private String erpResMsg;

}
