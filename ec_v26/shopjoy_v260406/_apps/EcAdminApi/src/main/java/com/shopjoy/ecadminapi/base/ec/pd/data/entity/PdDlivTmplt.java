package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_dliv_tmplt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 배송 템플릿 엔티티
public class PdDlivTmplt {

    @Id
    @Column(name = "dliv_tmplt_id", length = 21, nullable = false)
    private String dlivTmpltId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "dliv_tmplt_nm", length = 100, nullable = false)
    private String dlivTmpltNm;

    @Column(name = "dliv_method_cd", length = 20)
    private String dlivMethodCd;

    @Column(name = "dliv_pay_type_cd", length = 20)
    private String dlivPayTypeCd;

    @Column(name = "dliv_courier_cd", length = 30)
    private String dlivCourierCd;

    @Column(name = "dliv_cost")
    private Long dlivCost;

    @Column(name = "free_dliv_min_amt")
    private Long freeDlivMinAmt;

    @Column(name = "island_extra_cost")
    private Long islandExtraCost;

    @Column(name = "return_cost")
    private Long returnCost;

    @Column(name = "exchange_cost")
    private Long exchangeCost;

    @Column(name = "return_courier_cd", length = 30)
    private String returnCourierCd;

    @Column(name = "return_addr_zip", length = 10)
    private String returnAddrZip;

    @Column(name = "return_addr", length = 200)
    private String returnAddr;

    @Column(name = "return_addr_detail", length = 200)
    private String returnAddrDetail;

    @Column(name = "return_tel_no", length = 20)
    private String returnTelNo;

    @Column(name = "base_dliv_yn", length = 1)
    private String baseDlivYn;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}