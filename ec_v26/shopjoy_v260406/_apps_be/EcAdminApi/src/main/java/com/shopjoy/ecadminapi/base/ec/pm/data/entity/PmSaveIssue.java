package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_save_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 지급 이력 엔티티
@Comment("적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등)")
public class PmSaveIssue extends BaseEntity {

    @Id
    @Comment("적립지급ID (YYMMDDhhmmss+rand4)")
    @Column(name = "save_issue_id", length = 21, nullable = false)
    @Size(max = 21, message = "saveIssueId 는 21자 이내여야 합니다.")
    private String saveIssueId;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("지급유형 (코드: SAVE_ISSUE_TYPE_CD — ORDER/EVENT/REVIEW/REFERRAL/ADMIN)")
    @Column(name = "save_issue_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "saveIssueTypeCd 는 20자 이내여야 합니다.")
    private String saveIssueTypeCd;

    @Comment("지급 적립금액")
    @Column(name = "save_amt", nullable = false)
    private Long saveAmt;

    @Comment("적립률 (%, 구매적립 시)")
    @Column(name = "save_rate")
    private BigDecimal saveRate;

    @Comment("참조유형 (ORDER/EVENT/REVIEW/ADMIN)")
    @Column(name = "ref_type_cd", length = 20)
    @Size(max = 20, message = "refTypeCd 는 20자 이내여야 합니다.")
    private String refTypeCd;

    @Comment("참조ID (order_id / event_id 등)")
    @Column(name = "ref_id", length = 21)
    @Size(max = 21, message = "refId 는 21자 이내여야 합니다.")
    private String refId;

    @Comment("주문ID (od_order.order_id, 구매적립 시)")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("주문상품ID (od_order_item.order_item_id, 상품별 적립 시)")
    @Column(name = "order_item_id", length = 21)
    @Size(max = 21, message = "orderItemId 는 21자 이내여야 합니다.")
    private String orderItemId;

    @Comment("상품ID (pd_prod.prod_id, 적립 기준 상품)")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("소멸예정일")
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Comment("지급상태 (코드: ISSUE_STATUS_CD — PENDING/CONFIRMED/EXPIRED/CANCELED)")
    @Column(name = "issue_status_cd", length = 20)
    @Size(max = 20, message = "issueStatusCd 는 20자 이내여야 합니다.")
    private String issueStatusCd;

    @Comment("변경 전 지급상태")
    @Column(name = "issue_status_cd_before", length = 20)
    @Size(max = 20, message = "issueStatusCdBefore 는 20자 이내여야 합니다.")
    private String issueStatusCdBefore;

    @Comment("지급 메모")
    @Column(name = "save_memo", length = 300)
    @Size(max = 100, message = "saveMemo 는 100자 이내여야 합니다.")
    private String saveMemo;

}
