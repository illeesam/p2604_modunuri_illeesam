package com.shopjoy.ecBeBo.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "giftIssueId 는 21자 이내여야 합니다.")
    private String giftIssueId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("사은품ID (pm_gift.gift_id)")
    @Column(name = "gift_id", length = 21, nullable = false)
    @Size(max = 21, message = "giftId 는 21자 이내여야 합니다.")
    private String giftId;


    @Comment("회원ID")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("기준주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("발급일시")
    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Comment("상태 (코드: GIFT_ISSUE_STATUS_CD)")
    @Column(name = "gift_issue_status_cd", length = 20)
    @Size(max = 20, message = "giftIssueStatusCd 는 20자 이내여야 합니다.")
    private String giftIssueStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "gift_issue_status_cd_before", length = 20)
    @Size(max = 20, message = "giftIssueStatusCdBefore 는 20자 이내여야 합니다.")
    private String giftIssueStatusCdBefore;

    @Comment("메모")
    @Column(name = "gift_issue_memo", columnDefinition = "TEXT")
    @Size(max = 500000, message = "giftIssueMemo 는 500,000자 이내여야 합니다.")
    private String giftIssueMemo;

}
