package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "st_settle_close", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 마감 엔티티
public class StSettleClose extends BaseEntity {

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

}
