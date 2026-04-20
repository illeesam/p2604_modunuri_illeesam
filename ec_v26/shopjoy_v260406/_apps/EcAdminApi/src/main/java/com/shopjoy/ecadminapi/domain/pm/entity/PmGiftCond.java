package com.shopjoy.ecadminapi.domain.pm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_gift_cond", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 사은품 지급 조건 엔티티
public class PmGiftCond {

    @Id
    @Column(name = "gift_cond_id", length = 20, nullable = false)
    private String giftCondId;

    @Column(name = "gift_id", length = 20, nullable = false)
    private String giftId;

    @Column(name = "site_id", length = 20)
    private String siteId;

    @Column(name = "cond_type_cd", length = 20, nullable = false)
    private String condTypeCd;

    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Column(name = "target_id", length = 20)
    private String targetId;

    @Column(name = "reg_by", length = 20)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

}