package com.shopjoy.ecadminapi.base.ec.od.data.entity;

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
@Table(name = "odh_claim_item_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 클레임 아이템 상태 이력 엔티티
@Comment("클레임상품 상태 이력")
public class OdhClaimItemStatusHist extends BaseEntity {

    @Id
    @Comment("클레임상품상태이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "claim_item_status_hist_id", length = 21, nullable = false)
    private String claimItemStatusHistId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("클레임상품ID (od_claim_item.claim_item_id)")
    @Column(name = "claim_item_id", length = 21, nullable = false)
    private String claimItemId;

    @Comment("클레임ID (od_claim.claim_id)")
    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Comment("주문상품ID (od_order_item.order_item_id)")
    @Column(name = "order_item_id", length = 21)
    private String orderItemId;

    @Comment("변경 전 클레임상품상태 (코드: CLAIM_ITEM_STATUS)")
    @Column(name = "claim_item_status_cd_before", length = 20)
    private String claimItemStatusCdBefore;

    @Comment("변경 후 클레임상품상태 (코드: CLAIM_ITEM_STATUS)")
    @Column(name = "claim_item_status_cd", length = 20)
    private String claimItemStatusCd;

    @Comment("상태 변경 사유")
    @Column(name = "status_reason", length = 300)
    private String statusReason;

    @Comment("변경 담당자 (sy_user.user_id, mb_member.member_id)")
    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Comment("변경 일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Comment("메모")
    @Column(name = "memo", length = 300)
    private String memo;

}
