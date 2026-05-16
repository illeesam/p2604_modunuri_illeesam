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
@Table(name = "st_recon", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 대사(Reconciliation) 엔티티
@Comment("정산 대사 (기대금액 vs 실제금액 불일치 관리)")
public class StRecon extends BaseEntity {

    @Id
    @Comment("대사ID (YYMMDDhhmmss+rand4)")
    @Column(name = "recon_id", length = 21, nullable = false)
    private String reconId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("업체ID")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("대사유형 (코드: RECON_TYPE — ORDER/PAY/CLAIM/VENDOR)")
    @Column(name = "recon_type_cd", length = 20, nullable = false)
    private String reconTypeCd;

    @Comment("대사상태 (코드: RECON_STATUS — MATCHED/MISMATCH/RESOLVED)")
    @Column(name = "recon_status_cd", length = 20)
    private String reconStatusCd;

    @Comment("변경 전 대사상태")
    @Column(name = "recon_status_cd_before", length = 20)
    private String reconStatusCdBefore;

    @Comment("정산ID (st_settle.settle_id)")
    @Column(name = "settle_id", length = 21)
    private String settleId;

    @Comment("수집원장ID (st_settle_raw.settle_raw_id)")
    @Column(name = "settle_raw_id", length = 21)
    private String settleRawId;

    @Comment("참조ID (order_id / pay_id / claim_id 등)")
    @Column(name = "ref_id", length = 21)
    private String refId;

    @Comment("참조번호 스냅샷")
    @Column(name = "ref_no", length = 50)
    private String refNo;

    @Comment("정산기간 (YYYY-MM)")
    @Column(name = "settle_period", length = 7)
    private String settlePeriod;

    @Comment("기대금액 (정산 계산값)")
    @Column(name = "expected_amt")
    private Long expectedAmt;

    @Comment("실제금액 (외부/결제 확인값)")
    @Column(name = "actual_amt")
    private Long actualAmt;

    @Comment("차이금액 (expected_amt - actual_amt)")
    @Column(name = "diff_amt")
    private Long diffAmt;

    @Comment("대사 메모")
    @Column(name = "recon_note", columnDefinition = "TEXT")
    private String reconNote;

    @Comment("해소 처리자 (sy_user.user_id)")
    @Column(name = "resolved_by", length = 20)
    private String resolvedBy;

    @Comment("해소 일시")
    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;

}
