package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_gift", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 사은품 엔티티
public class PmGift {

    @Id
    @Column(name = "gift_id", length = 21, nullable = false)
    private String giftId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "gift_nm", length = 100, nullable = false)
    private String giftNm;

    @Column(name = "gift_type_cd", length = 20)
    private String giftTypeCd;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "gift_stock")
    private Integer giftStock;

    @Lob
    @Column(name = "gift_desc", columnDefinition = "TEXT")
    private String giftDesc;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "gift_status_cd", length = 20)
    private String giftStatusCd;

    @Column(name = "gift_status_cd_before", length = 20)
    private String giftStatusCdBefore;

    @Column(name = "mem_grade_cd", length = 20)
    private String memGradeCd;

    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Column(name = "min_order_qty")
    private Integer minOrderQty;

    @Column(name = "self_cdiv_rate")
    private BigDecimal selfCdivRate;

    @Column(name = "seller_cdiv_rate")
    private BigDecimal sellerCdivRate;

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