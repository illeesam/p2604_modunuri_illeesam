package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_settle_close", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 마감 엔티티
public class StSettleClose {

    @Id
    @Column(name = "settle_close_id", length = 21, nullable = false)
    private String settleCloseId;

    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "close_status_cd", length = 20, nullable = false)
    private String closeStatusCd;

    @Column(name = "close_reason", length = 200)
    private String closeReason;

    @Column(name = "final_settle_amt")
    private Long finalSettleAmt;

    @Column(name = "close_by", length = 20, nullable = false)
    private String closeBy;

    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}