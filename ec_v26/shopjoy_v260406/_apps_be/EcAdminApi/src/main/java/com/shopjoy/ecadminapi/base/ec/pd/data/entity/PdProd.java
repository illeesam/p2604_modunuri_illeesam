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

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("카테고리ID")
    @Column(name = "category_id", length = 21)
    @Size(max = 21, message = "categoryId 는 21자 이내여야 합니다.")
    private String categoryId;

    @Comment("브랜드ID")
    @Column(name = "brand_id", length = 21)
    @Size(max = 21, message = "brandId 는 21자 이내여야 합니다.")
    private String brandId;

    @Comment("업체ID")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("담당MD (sy_user.user_id) — 등록 시 본인 기본값, 변경 가능")
    @Column(name = "md_user_id", length = 21)
    @Size(max = 21, message = "mdUserId 는 21자 이내여야 합니다.")
    private String mdUserId;

    @Comment("상품명")
    @Column(name = "prod_nm", length = 200, nullable = false)
    @Size(max = 200, message = "prodNm 는 200자 이내여야 합니다.")
    private String prodNm;

    @Comment("상품유형 (코드: PROD_TYPE_CD — SINGLE/GROUP/SET)")
    @Column(name = "prod_type_cd", length = 20)
    @Size(max = 20, message = "prodTypeCd 는 20자 이내여야 합니다.")
    private String prodTypeCd;

    @Comment("상품코드(SKU)")
    @Column(name = "prod_code", length = 50)
    @Size(max = 50, message = "prodCode 는 50자 이내여야 합니다.")
    private String prodCode;

    @Comment("정가")
    @Column(name = "std_price")
    private Long stdPrice;

    @Comment("판매가")
    @Column(name = "sale_price")
    private Long salePrice;

    @Comment("통화코드 (KRW/USD/CNY/JPY, 기본 KRW) - 정가/판매가 등 금액 필드의 표시 기준 통화. 환율 변환은 하지 않음")
    @Column(name = "curr_cd", length = 3)
    @Size(max = 3, message = "currCd 는 3자 이내여야 합니다.")
    private String currCd;

    @Comment("판매할인율 (%) — 정가 대비. sale_discnt_amt 와 상호 동기화되는 입력 편의용 보조값")
    @Column(name = "sale_discnt_rate")
    private BigDecimal saleDiscntRate;

    @Comment("판매할인금액 (원) — 정가-판매가 최종 기준값. sale_price/sale_discnt_rate 편집 시 항상 재계산되어 저장됨")
    @Column(name = "sale_discnt_amt")
    private Long saleDiscntAmt;

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

    @Comment("상태 (코드: PROD_STATUS_CD)")
    @Column(name = "prod_status_cd", length = 20)
    @Size(max = 20, message = "prodStatusCd 는 20자 이내여야 합니다.")
    private String prodStatusCd;

    @Comment("변경 전 상품상태 (코드: PROD_STATUS_CD)")
    @Column(name = "prod_status_cd_before", length = 20)
    @Size(max = 20, message = "prodStatusCdBefore 는 20자 이내여야 합니다.")
    private String prodStatusCdBefore;

    @Comment("썸네일URL")
    @Column(name = "thumbnail_url", length = 500)
    @Size(max = 500, message = "thumbnailUrl 는 500자 이내여야 합니다.")
    private String thumbnailUrl;

    /* 상품 상세설명은 이미지가 많이 들어가는 페이지라 넉넉하게 잡는다.
       에디터가 이미지를 서버 업로드 없이 base64 그대로 인라인하므로(BaseComp.js addImageBlobHook),
       스마트폰 원본 사진 한 장만 해도 base64 변환 시 수백만 자가 될 수 있다 — 여러 장 첨부 대비 상한을 크게 둔다. */
    @Comment("상세설명 (HTML)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    @Size(max = 10000000, message = "contentHtml 는 10,000,000자 이내여야 합니다.")
    private String contentHtml;

    @Comment("무게(kg)")
    @Column(name = "weight")
    private BigDecimal weight;

    @Comment("사이즈 (코드: SIZE_INFO_CD)")
    @Column(name = "size_info_cd", length = 100)
    @Size(max = 100, message = "sizeInfoCd 는 100자 이내여야 합니다.")
    private String sizeInfoCd;

    @Comment("신상품여부 Y/N")
    @Column(name = "is_new", length = 1)
    @Size(max = 1, message = "isNew 는 1자 이내여야 합니다.")
    private String isNew;

    @Comment("베스트여부 Y/N")
    @Column(name = "is_best", length = 1)
    @Size(max = 1, message = "isBest 는 1자 이내여야 합니다.")
    private String isBest;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    @Comment("판매기간 시작 (NOT NULL — 미입력 시 등록시각으로 자동 설정, '즉시'를 NULL 대신 실제 시각으로 표현)")
    @Column(name = "sale_start_date", nullable = false)
    private LocalDateTime saleStartDate;

    @Comment("판매기간 종료 (NULL=무기한)")
    @Column(name = "sale_end_date")
    private LocalDateTime saleEndDate;

    @Comment("전시기간 시작 (NOT NULL — 미입력 시 등록시각으로 자동 설정) - sale_start_date 이전이면 출시예정 표시")
    @Column(name = "disp_start_date", nullable = false)
    private LocalDateTime dispStartDate;

    @Comment("전시기간 종료 (NULL=무기한) - 상품페이지 노출 종료 시점")
    @Column(name = "disp_end_date")
    private LocalDateTime dispEndDate;

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
    @Size(max = 1, message = "adltYn 는 1자 이내여야 합니다.")
    private String adltYn;

    @Comment("당일배송여부 Y/N")
    @Column(name = "same_day_dliv_yn", length = 1)
    @Size(max = 1, message = "sameDayDlivYn 는 1자 이내여야 합니다.")
    private String sameDayDlivYn;

    @Comment("품절여부 Y/N")
    @Column(name = "sold_out_yn", length = 1)
    @Size(max = 1, message = "soldOutYn 는 1자 이내여야 합니다.")
    private String soldOutYn;

    @Comment("배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)")
    @Column(name = "dliv_tmplt_id", length = 21)
    @Size(max = 21, message = "dlivTmpltId 는 21자 이내여야 합니다.")
    private String dlivTmpltId;

    @Comment("배송방법 override (코드: DLIV_METHOD_CD) - NULL이면 배송템플릿(dliv_tmplt_id) 기본값 사용")
    @Column(name = "dliv_method_cd", length = 30)
    @Size(max = 30, message = "dlivMethodCd 는 30자 이내여야 합니다.")
    private String dlivMethodCd;

    @Comment("쿠폰 사용 가능 여부 Y/N")
    @Column(name = "coupon_use_yn", length = 1)
    @Size(max = 1, message = "couponUseYn 는 1자 이내여야 합니다.")
    private String couponUseYn;

    @Comment("적립금 사용 가능 여부 Y/N")
    @Column(name = "save_use_yn", length = 1)
    @Size(max = 1, message = "saveUseYn 는 1자 이내여야 합니다.")
    private String saveUseYn;

    @Comment("할인 적용 가능 여부 Y/N")
    @Column(name = "discnt_use_yn", length = 1)
    @Size(max = 1, message = "discntUseYn 는 1자 이내여야 합니다.")
    private String discntUseYn;

    @Comment("홍보문구 (500자 이내)")
    @Column(name = "advrt_stmt", length = 500)
    @Size(max = 500, message = "advrtStmt 는 500자 이내여야 합니다.")
    private String advrtStmt;

    @Comment("홍보문구 시작일시")
    @Column(name = "advrt_start_date")
    private LocalDateTime advrtStartDate;

    @Comment("홍보문구 종료일시")
    @Column(name = "advrt_end_date")
    private LocalDateTime advrtEndDate;

    @Comment("시뮬데이터여부 (Y/N)")
    @Column(name = "simul_yn", length = 1, columnDefinition = "VARCHAR(1) DEFAULT 'N'")
    @Size(max = 1, message = "simulYn 는 1자 이내여야 합니다.")
    private String simulYn;

    @Comment("옵션 표준코드 (예: COLOR, SIZE — 공통코드 그룹 기준)")
    @Column(name = "prod_opt_std_cd", length = 20)
    @Size(max = 20, message = "prodOptStdCd 는 20자 이내여야 합니다.")
    private String prodOptStdCd;

    @Comment("옵션유형1 분류코드 (예: COLOR)")
    @Column(name = "prod_opt1_type_cd", length = 20)
    @Size(max = 20, message = "prodOpt1TypeCd 는 20자 이내여야 합니다.")
    private String prodOpt1TypeCd;

    @Comment("옵션유형2 분류코드 (예: SIZE)")
    @Column(name = "prod_opt2_type_cd", length = 20)
    @Size(max = 20, message = "prodOpt2TypeCd 는 20자 이내여야 합니다.")
    private String prodOpt2TypeCd;

}
