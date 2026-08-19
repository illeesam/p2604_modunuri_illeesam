package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_gift", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사은품 엔티티
@Comment("사은품")
public class PmGift extends BaseEntity {

    @Id
    @Comment("사은품ID (YYMMDDhhmmss+rand4)")
    @Column(name = "gift_id", length = 21, nullable = false)
    @Size(max = 21, message = "giftId 는 21자 이내여야 합니다.")
    private String giftId;


    @Comment("사은품명")
    @Column(name = "gift_nm", length = 100, nullable = false)
    @Size(max = 100, message = "giftNm 는 100자 이내여야 합니다.")
    private String giftNm;

    @Comment("사은품유형 (코드: GIFT_TYPE_CD — PRODUCT/SAMPLE/ETC)")
    @Column(name = "gift_type_cd", length = 20)
    @Size(max = 20, message = "giftTypeCd 는 20자 이내여야 합니다.")
    private String giftTypeCd;

    @Comment("연결 상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("사은품 재고")
    @Column(name = "gift_stock")
    private Integer giftStock;

    @Comment("사은품 설명")
    @Column(name = "gift_desc", columnDefinition = "TEXT")
    @Size(max = 500000, message = "giftDesc 는 500,000자 이내여야 합니다.")
    private String giftDesc;

    @Comment("시작일시")
    @Column(name = "start_date")
    private LocalDate startDate;

    @Comment("종료일시")
    @Column(name = "end_date")
    private LocalDate endDate;

    @Comment("상태 (코드: GIFT_STATUS_CD)")
    @Column(name = "gift_status_cd", length = 20)
    @Size(max = 20, message = "giftStatusCd 는 20자 이내여야 합니다.")
    private String giftStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "gift_status_cd_before", length = 20)
    @Size(max = 20, message = "giftStatusCdBefore 는 20자 이내여야 합니다.")
    private String giftStatusCdBefore;

    @Comment("적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)")
    @Column(name = "mem_grade_cd", length = 20)
    @Size(max = 20, message = "memGradeCd 는 20자 이내여야 합니다.")
    private String memGradeCd;

    @Comment("최소주문금액 — 사은품 지급 기준 금액")
    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Comment("최소주문수량 (NULL=제한없음)")
    @Column(name = "min_order_qty")
    private Integer minOrderQty;

    @Comment("자사(사이트) 분담율 (%) — 기본 100%")
    @Column(name = "self_cdiv_rate")
    private BigDecimal selfCdivRate;

    @Comment("판매자(업체) 분담율 (%) — 기본 0%")
    @Column(name = "seller_cdiv_rate")
    private BigDecimal sellerCdivRate;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("판매업체 (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("판매담당자명 (업체 선택 시 자동 채움, 수정 가능)")
    @Column(name = "charge_staff", length = 50)
    @Size(max = 50, message = "chargeStaff 는 50자 이내여야 합니다.")
    private String chargeStaff;

    @Comment("공개대상 (^코드^코드^ 형식, 예: ^PUBLIC^)")
    @Column(name = "visibility_targets", length = 200)
    @Size(max = 100, message = "visibilityTargets 는 100자 이내여야 합니다.")
    private String visibilityTargets;

}
