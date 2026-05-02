package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "st_erp_voucher_line", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// ERP 전표 상세 엔티티
public class StErpVoucherLine extends BaseEntity {

    @Id
    @Column(name = "erp_voucher_line_id", length = 21, nullable = false)
    private String erpVoucherLineId;

    @Column(name = "erp_voucher_id", length = 21, nullable = false)
    private String erpVoucherId;

    @Column(name = "line_no", nullable = false)
    private Integer lineNo;

    @Column(name = "account_cd", length = 20, nullable = false)
    private String accountCd;

    @Column(name = "account_nm", length = 100)
    private String accountNm;

    @Column(name = "cost_center_cd", length = 20)
    private String costCenterCd;

    @Column(name = "profit_center_cd", length = 20)
    private String profitCenterCd;

    @Column(name = "debit_amt")
    private Long debitAmt;

    @Column(name = "credit_amt")
    private Long creditAmt;

    @Column(name = "ref_type_cd", length = 20)
    private String refTypeCd;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "line_memo", length = 300)
    private String lineMemo;

}
