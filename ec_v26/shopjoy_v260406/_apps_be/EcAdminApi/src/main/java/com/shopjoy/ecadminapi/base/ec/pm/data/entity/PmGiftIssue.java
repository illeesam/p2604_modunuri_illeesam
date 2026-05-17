package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

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
@Table(name = "pm_gift_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사은품 발행 이력 엔티티
@Comment("사은품 발급")
public class PmGiftIssue extends BaseEntity {

    @Id
    @Comment("사은품발급ID")
    @Column(name = "gift_issue_id", length = 21, nullable = false)
    private String giftIssueId;

    @Comment("사은품ID (pm_gift.gift_id)")
    @Column(name = "gift_id", length = 21, nullable = false)
    private String giftId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("기준주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    private String orderId;

    @Comment("발급일시")
    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Comment("상태 (코드: GIFT_ISSUE_STATUS)")
    @Column(name = "gift_issue_status_cd", length = 20)
    private String giftIssueStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "gift_issue_status_cd_before", length = 20)
    private String giftIssueStatusCdBefore;

    @Comment("메모")
    @Column(name = "gift_issue_memo", columnDefinition = "TEXT")
    private String giftIssueMemo;

}
