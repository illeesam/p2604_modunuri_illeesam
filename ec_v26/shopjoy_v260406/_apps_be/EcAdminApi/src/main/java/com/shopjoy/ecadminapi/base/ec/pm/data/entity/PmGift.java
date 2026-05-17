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
    private String giftId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("사은품명")
    @Column(name = "gift_nm", length = 100, nullable = false)
    private String giftNm;

    @Comment("사은품유형 (코드: GIFT_TYPE — PRODUCT/SAMPLE/ETC)")
    @Column(name = "gift_type_cd", length = 20)
    private String giftTypeCd;

    @Comment("연결 상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Comment("사은품 재고")
    @Column(name = "gift_stock")
    private Integer giftStock;

    @Comment("사은품 설명")
    @Column(name = "gift_desc", columnDefinition = "TEXT")
    private String giftDesc;

    @Comment("시작일시")
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Comment("종료일시")
    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Comment("상태 (코드: GIFT_STATUS)")
    @Column(name = "gift_status_cd", length = 20)
    private String giftStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "gift_status_cd_before", length = 20)
    private String giftStatusCdBefore;

    @Comment("적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)")
    @Column(name = "mem_grade_cd", length = 20)
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
    private String useYn;

}
