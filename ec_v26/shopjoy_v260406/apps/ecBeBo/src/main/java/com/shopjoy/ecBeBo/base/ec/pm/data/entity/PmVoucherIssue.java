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
@Table(name = "pm_voucher_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 바우처(상품권) 발행 이력 엔티티
@Comment("상품권 발급 및 사용 이력")
public class PmVoucherIssue extends BaseEntity {

    @Id
    @Comment("상품권발급ID")
    @Column(name = "voucher_issue_id", length = 21, nullable = false)
    @Size(max = 21, message = "voucherIssueId 는 21자 이내여야 합니다.")
    private String voucherIssueId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("상품권ID (pm_voucher.voucher_id)")
    @Column(name = "voucher_id", length = 21, nullable = false)
    @Size(max = 21, message = "voucherId 는 21자 이내여야 합니다.")
    private String voucherId;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("발급 고유코드")
    @Column(name = "voucher_code", length = 50, nullable = false)
    @Size(max = 50, message = "voucherCode 는 50자 이내여야 합니다.")
    private String voucherCode;

    @Comment("발급일시")
    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Comment("만료일시")
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Comment("사용일시")
    @Column(name = "use_date")
    private LocalDateTime useDate;

    @Comment("사용된 주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("실제 사용 할인금액")
    @Column(name = "use_amt")
    private Long useAmt;

    @Comment("상태 (코드: VOUCHER_ISSUE_STATUS_CD)")
    @Column(name = "voucher_issue_status_cd", length = 20)
    @Size(max = 20, message = "voucherIssueStatusCd 는 20자 이내여야 합니다.")
    private String voucherIssueStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "voucher_issue_status_cd_before", length = 20)
    @Size(max = 20, message = "voucherIssueStatusCdBefore 는 20자 이내여야 합니다.")
    private String voucherIssueStatusCdBefore;

}
