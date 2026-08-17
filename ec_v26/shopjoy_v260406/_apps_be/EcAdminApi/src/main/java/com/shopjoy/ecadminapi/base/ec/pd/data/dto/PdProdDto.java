package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PdProdDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 21) private String prodId;              // 상품ID 필터
        private List<String> prodIds;                  // PK 다건 IN
        @Size(max = 21)  private String brandId;            // 브랜드ID 필터
        @Size(max = 200) private String brandNm;    // 브랜드명 LIKE 필터 (직접 입력 시)
        @Size(max = 21)  private String vendorId;           // 업체ID 필터
        @Size(max = 200) private String vendorNm;   // 업체명 LIKE 필터 (직접 입력 시)
        @Size(max = 21)  private String categoryId;         // 카테고리ID 필터
        @Size(max = 21)  private String mdUserId;           // 담당MD(sy_user.user_id) 필터
        @Size(max = 200) private String mdUserNm;   // 담당MD명 LIKE 필터 (직접 입력 시)
        @Size(max = 30) private String prodTypeCd;          // 상품유형 필터 — PROD_TYPE_CD {SINGLE:단품, OPTION:옵션상품, GROUP:묶음상품, SET:세트상품, GIFT:사은품}
        @Size(max = 30) private String prodStatusCd;      // 상품상태 단건 필터 (strEq)
        private List<String> prodStatusCds;               // 상품상태 다중 필터 (strIn, BO multiCheck)
        @Size(max = 1) private String useYn;                // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodId;              // 상품ID (YYMMDDhhmmss+rand4)
        private String categoryId;          // 카테고리ID
        private String brandId;             // 브랜드ID
        private String vendorId;            // 업체ID
        private String mdUserId;            // 담당MD (sy_user.user_id) — 등록 시 본인 기본값, 변경 가능
        private String prodNm;              // 상품명
        private String prodTypeCd;          // 상품유형 — PROD_TYPE_CD {SINGLE:단품, OPTION:옵션상품, GROUP:묶음상품, SET:세트상품, GIFT:사은품}
        private String prodCode;            // 상품코드(SKU)
        private Long listPrice;             // 정가
        private Long salePrice;             // 판매가
        private Long purchasePrice;         // 매입가(원가) — 내부 관리용
        private BigDecimal marginRate;      // 마진율 (%) — 내부 관리용
        private BigDecimal platformFeeRate; // 플랫폼수수료 율 (%) — 내부 관리용
        private Long platformFeeAmount;     // 플랫폼수수료 금액 (원) — 내부 관리용. rate 와 amount 중 입력된 값을 우선 사용
        private String prodStatusCd;        // 상태 — PROD_STATUS_CD {ACTIVE:판매중, INACTIVE:중지, SOLDOUT:품절, DRAFT:임시저장}
        private String prodStatusCdBefore;  // 변경 전 상품상태 — PROD_STATUS_CD {ACTIVE:판매중, INACTIVE:중지, SOLDOUT:품절, DRAFT:임시저장}
        private String thumbnailUrl;        // 썸네일URL
        private String contentHtml;         // 상세설명 (HTML)
        private BigDecimal weight;          // 무게(kg)
        private String sizeInfoCd;          // 사이즈 — SIZE_INFO_CD {FREE:FREE, XS:XS, S:S, M:M, L:L, XL:XL}
        private String isNew;               // 신상품여부 Y/N
        private String isBest;              // 베스트여부 Y/N
        private Integer viewCount;          // 조회수
        private LocalDateTime saleStartDate; // 판매기간 시작 (NULL=즉시)
        private LocalDateTime saleEndDate;  // 판매기간 종료 (NULL=무기한)
        private Integer minBuyQty;          // 최소구매수량 (기본 1)
        private Integer maxBuyQty;          // 최대구매수량 (NULL=무제한)
        private Integer dayMaxBuyQty;       // 1일 최대구매수량 (NULL=무제한)
        private Integer idMaxBuyQty;        // ID당 최대구매수량 (NULL=무제한)
        private String adltYn;              // 성인상품 여부 Y/N
        private String sameDayDlivYn;       // 당일배송여부 Y/N
        private String soldOutYn;           // 품절여부 Y/N
        private String dlivTmpltId;         // 배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)
        private String couponUseYn;         // 쿠폰 사용 가능 여부 Y/N
        private String saveUseYn;           // 적립금 사용 가능 여부 Y/N
        private String discntUseYn;         // 할인 적용 가능 여부 Y/N
        private String advrtStmt;           // 홍보문구 (500자 이내)
        private LocalDateTime advrtStartDate; // 홍보문구 시작일시
        private LocalDateTime advrtEndDate; // 홍보문구 종료일시
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
        private String cateNm;              // 카테고리명 (조인 표시용)
        private String parentCategoryId;    // 상위 카테고리ID (조인 표시용)
        private String brandNm;             // 브랜드명 (조인 표시용)
        private String vendorNm;            // 업체명 (조인 표시용)
        private String vendorTel;           // 업체 전화번호 (조인 표시용)
        private String mdUserNm;            // 담당MD명 (조인 표시용)
        private String prodStatusCdNm;      // 상품상태 코드라벨 (조인 표시용)
        private String prodTypeCdNm;        // 상품유형 코드라벨 (조인 표시용)
        private String sizeInfoCdNm;        // 사이즈 코드라벨 (조인 표시용)
        private String simulYn;             // 시뮬데이터여부 Y/N
        private String prodOptStdCd;     // 옵션 표준코드 (공통코드 그룹 기준)
        private String prodOptType1Cd;   // 옵션유형1 분류코드 (예: COLOR)
        private String prodOptType2Cd;   // 옵션유형2 분류코드 (예: SIZE)
        // ── Tier 1 상세 연관정보 (getDetail/_listFillRelations 시 채움) ──
        private Integer prodStock;                            // SKU 재고 합산 (목록용)
        private List<PdProdImgDto.Item>         prodImgs;     // 상품 이미지 목록
        private List<PdProdOptDto.Item>         prodOpts;     // 옵션값 목록 (pd_prod_opt)
        private List<PdProdSkuDto.Item>         prodSkus;     // SKU 목록
    }

}
