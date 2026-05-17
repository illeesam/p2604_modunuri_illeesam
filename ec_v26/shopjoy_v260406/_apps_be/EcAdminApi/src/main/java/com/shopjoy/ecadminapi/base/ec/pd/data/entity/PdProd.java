package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

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
@Table(name = "pd_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 엔티티
@Comment("상품")
public class PdProd extends BaseEntity {

    @Id
    @Comment("상품ID (YYMMDDhhmmss+rand4)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("카테고리ID")
    @Column(name = "category_id", length = 21)
    private String categoryId;

    @Comment("브랜드ID")
    @Column(name = "brand_id", length = 21)
    private String brandId;

    @Comment("업체ID")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("담당MD (sy_user.user_id) — 등록 시 본인 기본값, 변경 가능")
    @Column(name = "md_user_id", length = 21)
    private String mdUserId;

    @Comment("상품명")
    @Column(name = "prod_nm", length = 200, nullable = false)
    private String prodNm;

    @Comment("상품유형 (코드: PRODUCT_TYPE — SINGLE/GROUP/SET)")
    @Column(name = "prod_type_cd", length = 20)
    private String prodTypeCd;

    @Comment("상품코드(SKU)")
    @Column(name = "prod_code", length = 50)
    private String prodCode;

    @Comment("정가")
    @Column(name = "list_price")
    private Long listPrice;

    @Comment("판매가")
    @Column(name = "sale_price")
    private Long salePrice;

    @Comment("매입가(원가) — 내부 관리용")
    @Column(name = "purchase_price")
    private Long purchasePrice;

    @Comment("마진율 (%) — 내부 관리용")
    @Column(name = "margin_rate")
    private BigDecimal marginRate;

    @Comment("플랫폼수수료 율 (%) — 내부 관리용")
    @Column(name = "platform_fee_rate")
    private BigDecimal platformFeeRate;

    @Comment("플랫폼수수료 금액 (원) — 내부 관리용. rate 와 amount 중 입력된 값을 우선 사용")
    @Column(name = "platform_fee_amount")
    private Long platformFeeAmount;

    @Comment("재고수량")
    @Column(name = "prod_stock")
    private Integer prodStock;

    @Comment("상태 (코드: PRODUCT_STATUS)")
    @Column(name = "prod_status_cd", length = 20)
    private String prodStatusCd;

    @Comment("변경 전 상품상태 (코드: PRODUCT_STATUS)")
    @Column(name = "prod_status_cd_before", length = 20)
    private String prodStatusCdBefore;

    @Comment("썸네일URL")
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Comment("상세설명 (HTML)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Comment("무게(kg)")
    @Column(name = "weight")
    private BigDecimal weight;

    @Comment("사이즈 (코드: PRODUCT_SIZE)")
    @Column(name = "size_info_cd", length = 100)
    private String sizeInfoCd;

    @Comment("신상품여부 Y/N")
    @Column(name = "is_new", length = 1)
    private String isNew;

    @Comment("베스트여부 Y/N")
    @Column(name = "is_best", length = 1)
    private String isBest;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    @Comment("판매수")
    @Column(name = "sale_count")
    private Integer saleCount;

    @Comment("판매기간 시작 (NULL=즉시)")
    @Column(name = "sale_start_date")
    private LocalDateTime saleStartDate;

    @Comment("판매기간 종료 (NULL=무기한)")
    @Column(name = "sale_end_date")
    private LocalDateTime saleEndDate;

    @Comment("최소구매수량 (기본 1)")
    @Column(name = "min_buy_qty")
    private Integer minBuyQty;

    @Comment("최대구매수량 (NULL=무제한)")
    @Column(name = "max_buy_qty")
    private Integer maxBuyQty;

    @Comment("1일 최대구매수량 (NULL=무제한)")
    @Column(name = "day_max_buy_qty")
    private Integer dayMaxBuyQty;

    @Comment("ID당 최대구매수량 (NULL=무제한)")
    @Column(name = "id_max_buy_qty")
    private Integer idMaxBuyQty;

    @Comment("성인상품 여부 Y/N")
    @Column(name = "adlt_yn", length = 1)
    private String adltYn;

    @Comment("당일배송여부 Y/N")
    @Column(name = "same_day_dliv_yn", length = 1)
    private String sameDayDlivYn;

    @Comment("품절여부 Y/N")
    @Column(name = "sold_out_yn", length = 1)
    private String soldOutYn;

    @Comment("배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)")
    @Column(name = "dliv_tmplt_id", length = 21)
    private String dlivTmpltId;

    @Comment("쿠폰 사용 가능 여부 Y/N")
    @Column(name = "coupon_use_yn", length = 1)
    private String couponUseYn;

    @Comment("적립금 사용 가능 여부 Y/N")
    @Column(name = "save_use_yn", length = 1)
    private String saveUseYn;

    @Comment("할인 적용 가능 여부 Y/N")
    @Column(name = "discnt_use_yn", length = 1)
    private String discntUseYn;

    @Comment("홍보문구 (500자 이내)")
    @Column(name = "advrt_stmt", length = 500)
    private String advrtStmt;

    @Comment("홍보문구 시작일시")
    @Column(name = "advrt_start_date")
    private LocalDateTime advrtStartDate;

    @Comment("홍보문구 종료일시")
    @Column(name = "advrt_end_date")
    private LocalDateTime advrtEndDate;

}
