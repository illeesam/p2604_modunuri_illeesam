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
@Table(name = "st_settle_close", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 마감 엔티티
@Comment("정산마감 이력")
public class StSettleClose extends BaseEntity {

    @Id
    @Comment("마감이력ID")
    @Column(name = "settle_close_id", length = 21, nullable = false)
    private String settleCloseId;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21, nullable = false)
    private String settleId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("마감상태 (코드: SETTLE_CLOSE_STATUS — CLOSED/REOPENED)")
    @Column(name = "close_status_cd", length = 20, nullable = false)
    private String closeStatusCd;

    @Comment("마감/재오픈 사유")
    @Column(name = "close_reason", length = 200)
    private String closeReason;

    @Comment("마감 시점 최종정산금액 스냅샷")
    @Column(name = "final_settle_amt")
    private Long finalSettleAmt;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "close_by", length = 20, nullable = false)
    private String closeBy;

    @Comment("처리일시")
    @Column(name = "close_date")
    private LocalDateTime closeDate;

}
