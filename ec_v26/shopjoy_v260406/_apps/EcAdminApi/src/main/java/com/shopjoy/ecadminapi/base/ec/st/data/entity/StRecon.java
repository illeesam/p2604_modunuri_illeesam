package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_recon", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 대사(Reconciliation) 엔티티
public class StRecon {

    @Id
    @Column(name = "recon_id", length = 21, nullable = false)
    private String reconId;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "recon_type_cd", length = 20, nullable = false)
    private String reconTypeCd;

    @Column(name = "recon_status_cd", length = 20)
    private String reconStatusCd;

    @Column(name = "recon_status_cd_before", length = 20)
    private String reconStatusCdBefore;

    @Column(name = "settle_id", length = 21)
    private String settleId;

    @Column(name = "settle_raw_id", length = 21)
    private String settleRawId;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "ref_no", length = 50)
    private String refNo;

    @Column(name = "settle_period", length = 7)
    private String settlePeriod;

    @Column(name = "expected_amt")
    private Long expectedAmt;

    @Column(name = "actual_amt")
    private Long actualAmt;

    @Column(name = "diff_amt")
    private Long diffAmt;

    @Lob
    @Column(name = "recon_note", columnDefinition = "TEXT")
    private String reconNote;

    @Column(name = "resolved_by", length = 20)
    private String resolvedBy;

    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}