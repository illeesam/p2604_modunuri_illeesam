package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "st_erp_voucher_line", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// ERP 전표 상세 엔티티
@Comment("ERP 전표 라인 (분개 항목, 차변/대변 1행씩)")
public class StErpVoucherLine extends BaseEntity {

    @Id
    @Comment("전표라인ID (YYMMDDhhmmss+rand4)")
    @Column(name = "erp_voucher_line_id", length = 21, nullable = false)
    private String erpVoucherLineId;

    @Comment("ERP전표ID (st_erp_voucher.erp_voucher_id)")
    @Column(name = "erp_voucher_id", length = 21, nullable = false)
    private String erpVoucherId;

    @Comment("라인 순번 (전표 내 고유)")
    @Column(name = "line_no", nullable = false)
    private Integer lineNo;

    @Comment("계정코드 (ERP 계정과목 코드)")
    @Column(name = "account_cd", length = 20, nullable = false)
    private String accountCd;

    @Comment("계정명 스냅샷")
    @Column(name = "account_nm", length = 100)
    private String accountNm;

    @Comment("코스트센터 코드")
    @Column(name = "cost_center_cd", length = 20)
    private String costCenterCd;

    @Comment("수익센터 코드")
    @Column(name = "profit_center_cd", length = 20)
    private String profitCenterCd;

    @Comment("차변 금액 (대변과 상호 배타적)")
    @Column(name = "debit_amt")
    private Long debitAmt;

    @Comment("대변 금액 (차변과 상호 배타적)")
    @Column(name = "credit_amt")
    private Long creditAmt;

    @Comment("참조유형 (SETTLE/ORDER/CLAIM/PAY/ADJ)")
    @Column(name = "ref_type_cd", length = 20)
    private String refTypeCd;

    @Comment("참조ID (settle_id / order_id / claim_id 등)")
    @Column(name = "ref_id", length = 21)
    private String refId;

    @Comment("라인 적요")
    @Column(name = "line_memo", length = 300)
    private String lineMemo;

}
