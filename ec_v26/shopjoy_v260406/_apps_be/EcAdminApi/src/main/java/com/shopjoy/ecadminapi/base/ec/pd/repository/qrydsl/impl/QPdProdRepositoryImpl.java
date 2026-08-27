package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBrand;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

/** PdProd(상품) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdRepositoryImpl implements QPdProdRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdProd     pdProd   = QPdProd.pdProd;
    private static final QPdCategory pdCategory = QPdCategory.pdCategory;
    private static final QSyBrand    syBrand    = QSyBrand.syBrand;
    private static final QSyVendor   syVendor   = QSyVendor.syVendor;
    private static final QSyUser     syUser     = QSyUser.syUser;
    private static final QSyBrand    syBrandEx  = new QSyBrand("sy_brand_ex");
    private static final QSyVendor   syVendorEx = new QSyVendor("sy_vendor_ex");
    private static final QSyUser     syUserEx   = new QSyUser("sy_user_ex");
    private static final QVwSyCode     codeProdStatusCd = new QVwSyCode("cd_ps");
    private static final QVwSyCode     codeProdTypeCd = new QVwSyCode("cd_pt");
    private static final QVwSyCode     codeSizeInfoCd = new QVwSyCode("cd_sz");    /*
     * baseListQuery / selectById — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * PROD_STATUS_CD  {DRAFT: '임시저장', ACTIVE: '전시중', INACTIVE: '판매중지', ENDED: '판매종료'}
     * PROD_TYPE_CD   (PROD_TYPE)    {SINGLE: '단품', GROUP: '그룹상품', SET: '세트상품'} — Entity 주석 기준 예시(코드그룹 미등록)
     * SIZE_INFO_CD   (PRODUCT_SIZE)    {FREE: 'FREE', XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', XXL: 'XXL'}
     * IS_NEW/IS_BEST/ADLT_YN/SAME_DAY_DLIV_YN/SOLD_OUT_YN/COUPON_USE_YN/SAVE_USE_YN/DISCNT_USE_YN/SIMUL_YN  {Y: '예', N: '아니오'}
     */
    /** 목록/페이지 공용 base query — selectList/selectPageData 의 컬럼 셋 (thumbnail LEFT JOIN으로 1행 보장) */
    private JPAQuery<PdProdDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(PdProdDto.Item.class,
                        pdProd.prodId,                  // 상품ID (PK, YYMMDDhhmmss+rand4)
                        pdProd.categoryId,                // 카테고리ID
                        pdProd.brandId,                   // 브랜드ID
                        pdProd.vendorId,                  // 업체ID
                        pdProd.mdUserId,                  // 담당MD (sy_user.user_id)
                        pdProd.prodNm,                    // 상품명
                        pdProd.prodTypeCd,                 // 상품유형 — {SINGLE: '단품', GROUP: '그룹상품', SET: '세트상품'}
                        pdProd.prodCode,                  // 상품코드(SKU)
                        pdProd.stdPrice,                 // 정가
                        pdProd.salePrice,                 // 판매가
                        pdProd.currCd,                     // 통화코드 (KRW/USD/CNY/JPY, 기본 KRW)
                        pdProd.saleDiscntRate,             // 판매할인율(%) - 정가 대비, sale_discnt_amt 와 상호 동기화되는 보조값
                        pdProd.saleDiscntAmt,              // 판매할인금액(원) - 정가-판매가 최종 기준값
                        pdProd.purchasePrice,              // 매입가(원가) — 내부 관리용
                        pdProd.marginRate,                 // 마진율(%) — 내부 관리용
                        pdProd.platformFeeRate,             // 플랫폼수수료 율(%) — 내부 관리용
                        pdProd.platformFeeAmount,           // 플랫폼수수료 금액(원) — 내부 관리용
                        pdProd.prodStatusCd,                 // 상태 — PROD_STATUS_CD {DRAFT:임시저장, ACTIVE:전시중, INACTIVE:판매중지, ENDED:판매종료}
                        pdProd.prodStatusCdBefore,           // 변경 전 상품상태 — 동일 코드그룹
                        pdProd.contentHtml,                // 상세설명 (HTML)
                        pdProd.weight,                     // 무게(kg)
                        pdProd.sizeInfoCd,                   // 사이즈 — {FREE: 'FREE', XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', XXL: 'XXL'}
                        pdProd.isNew,                        // 신상품여부 — {Y: '예', N: '아니오'}
                        pdProd.isBest,                        // 베스트여부 — {Y: '예', N: '아니오'}
                        pdProd.viewCount,                  // 조회수
                        pdProd.saleStartDate,               // 판매기간 시작 (NULL=즉시)
                        pdProd.saleEndDate,                 // 판매기간 종료 (NULL=무기한)
                        pdProd.dispStartDate,               // 전시기간 시작 (NULL=즉시) - sale_start_date 이전이면 출시예정 표시
                        pdProd.dispEndDate,                 // 전시기간 종료 (NULL=무기한)
                        pdProd.minBuyQty,                  // 최소구매수량 (기본 1)
                        pdProd.maxBuyQty,                  // 최대구매수량 (NULL=무제한)
                        pdProd.dayMaxBuyQty,                // 1일 최대구매수량 (NULL=무제한)
                        pdProd.idMaxBuyQty,                 // ID당 최대구매수량 (NULL=무제한)
                        pdProd.adltYn,                        // 성인상품 여부 — {Y: '예', N: '아니오'}
                        pdProd.sameDayDlivYn,                  // 당일배송여부 — {Y: '예', N: '아니오'}
                        pdProd.soldOutYn,                      // 품절여부 — {Y: '예', N: '아니오'}
                        pdProd.dlivTmpltId,                 // 배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)
                        pdProd.dlivMethodCd,                 // 배송방법 override — DLIV_METHOD_CD, NULL=배송템플릿 기본값
                        pdProd.couponUseYn,                    // 쿠폰 사용 가능 여부 — {Y: '예', N: '아니오'}
                        pdProd.saveUseYn,                      // 적립금 사용 가능 여부 — {Y: '예', N: '아니오'}
                        pdProd.discntUseYn,                    // 할인 적용 가능 여부 — {Y: '예', N: '아니오'}
                        pdProd.advrtStmt,                  // 홍보문구 (500자 이내)
                        pdProd.advrtStartDate,              // 홍보문구 시작일시
                        pdProd.advrtEndDate,                // 홍보문구 종료일시
                        pdProd.simulYn,                        // 시뮬데이터여부 — {Y: '예', N: '아니오'}
                        pdProd.prodOptStdCd,                // 옵션 표준코드 (예: COLOR, SIZE)
                        pdProd.prodOpt1TypeCd,              // 옵션유형1 분류코드 (예: COLOR)
                        pdProd.prodOpt2TypeCd,              // 옵션유형2 분류코드 (예: SIZE)
                        pdProd.regBy,      // 등록자
                        pdProd.regDate,    // 등록일시
                        pdProd.updBy,      // 수정자
                        pdProd.updDate,    // 수정일시
                        pdCategory.categoryNm.as("cateNm"),        // 카테고리명 (조인)
                        syBrand.brandNm.as("brandNm"),             // 브랜드명 (조인)
                        syVendor.vendorNm.as("vendorNm"),          // 업체명 (조인)
                        syUser.userNm.as("mdUserNm"),               // 담당MD명 (조인)
                        codeProdStatusCd.codeLabel.as("prodStatusCdNm"),        // 상품상태 코드라벨 (조인, sy_code.PRODUCT_STATUS)
                        codeProdTypeCd.codeLabel.as("prodTypeCdNm"),          // 상품유형 코드라벨 (조인, sy_code.PROD_TYPE)
                        pdProd.thumbnailUrl,                          // 썸네일URL (직접 컬럼값; 없으면 _listFillRelations에서 imgMap으로 보완)
                        pdProd.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdProd.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdProd)
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(pdProd.categoryId)) // 카테고리
                .leftJoin(syBrand).on(syBrand.brandId.eq(pdProd.brandId)) // 브랜드
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pdProd.vendorId)) // 업체
                .leftJoin(syUser).on(syUser.userId.eq(pdProd.mdUserId)) // 사용자
                .leftJoin(codeProdStatusCd).on(codeProdStatusCd.codeGrp.eq("PROD_STATUS_CD").and(codeProdStatusCd.codeValue.eq(pdProd.prodStatusCd))) // 상품상태
                .leftJoin(codeProdTypeCd).on(codeProdTypeCd.codeGrp.eq("PROD_TYPE_CD").and(codeProdTypeCd.codeValue.eq(pdProd.prodTypeCd))) // 상품유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdProd.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdProd.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdProd.siteId)) // 사이트

                ;
    }

    /** 단건 조회 — selectById 와 동일 컬럼 셋 (size_info_cd_nm 포함) */
    @Override
    public Optional<PdProdDto.Item> selectById(String prodId) {
        /*
         * selectById — 코드성 필드 예시 코드값 (sy_code 등록 기준, baseListQuery 상단 참고와 동일)
         * PROD_STATUS_CD  {ON_SALE: '판매중', PREPARING: '준비중', SOLD_OUT: '품절', SUSPENDED: '판매중지'}
         * PROD_TYPE_CD    {SINGLE: '단품', GROUP: '그룹상품', SET: '세트상품'}
         * SIZE_INFO_CD    {FREE: 'FREE', XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', XXL: 'XXL'}
         */
        PdProdDto.Item dtl = queryFactory
                .select(Projections.bean(PdProdDto.Item.class,
                        // a.* equivalent
                        pdProd.prodId,                  // 상품ID (PK)
                        pdProd.categoryId,                // 카테고리ID
                        pdProd.brandId,                   // 브랜드ID
                        pdProd.vendorId,                  // 업체ID
                        pdProd.mdUserId,                  // 담당MD (sy_user.user_id)
                        pdProd.prodNm,                    // 상품명
                        pdProd.prodTypeCd,                 // 상품유형 — {SINGLE: '단품', GROUP: '그룹상품', SET: '세트상품'}
                        pdProd.prodCode,                  // 상품코드(SKU)
                        pdProd.stdPrice,                 // 정가
                        pdProd.salePrice,                 // 판매가
                        pdProd.currCd,                     // 통화코드 (KRW/USD/CNY/JPY, 기본 KRW)
                        pdProd.saleDiscntRate,             // 판매할인율(%) - 정가 대비, sale_discnt_amt 와 상호 동기화되는 보조값
                        pdProd.saleDiscntAmt,              // 판매할인금액(원) - 정가-판매가 최종 기준값
                        pdProd.purchasePrice,              // 매입가(원가) — 내부 관리용
                        pdProd.marginRate,                 // 마진율(%) — 내부 관리용
                        pdProd.platformFeeRate,             // 플랫폼수수료 율(%) — 내부 관리용
                        pdProd.platformFeeAmount,           // 플랫폼수수료 금액(원) — 내부 관리용
                        pdProd.prodStatusCd,                 // 상태 — PROD_STATUS_CD {DRAFT:임시저장, ACTIVE:전시중, INACTIVE:판매중지, ENDED:판매종료}
                        pdProd.prodStatusCdBefore,           // 변경 전 상품상태 — 동일 코드그룹
                        pdProd.thumbnailUrl,                // 썸네일URL (직접 컬럼값. COALESCE 서브쿼리는 baseListQuery 참고)
                        pdProd.contentHtml,                 // 상세설명 (HTML)
                        pdProd.weight,                     // 무게(kg)
                        pdProd.sizeInfoCd,                   // 사이즈 — {FREE: 'FREE', XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', XXL: 'XXL'}
                        pdProd.isNew,                        // 신상품여부 — {Y: '예', N: '아니오'}
                        pdProd.isBest,                        // 베스트여부 — {Y: '예', N: '아니오'}
                        pdProd.viewCount,                  // 조회수
                        pdProd.saleStartDate,               // 판매기간 시작 (NULL=즉시)
                        pdProd.saleEndDate,                 // 판매기간 종료 (NULL=무기한)
                        pdProd.dispStartDate,               // 전시기간 시작 (NULL=즉시) - sale_start_date 이전이면 출시예정 표시
                        pdProd.dispEndDate,                 // 전시기간 종료 (NULL=무기한)
                        pdProd.minBuyQty,                  // 최소구매수량 (기본 1)
                        pdProd.maxBuyQty,                  // 최대구매수량 (NULL=무제한)
                        pdProd.dayMaxBuyQty,                // 1일 최대구매수량 (NULL=무제한)
                        pdProd.idMaxBuyQty,                 // ID당 최대구매수량 (NULL=무제한)
                        pdProd.adltYn,                        // 성인상품 여부 — {Y: '예', N: '아니오'}
                        pdProd.sameDayDlivYn,                  // 당일배송여부 — {Y: '예', N: '아니오'}
                        pdProd.soldOutYn,                      // 품절여부 — {Y: '예', N: '아니오'}
                        pdProd.dlivTmpltId,                 // 배송템플릿ID
                        pdProd.dlivMethodCd,                 // 배송방법 override — DLIV_METHOD_CD, NULL=배송템플릿 기본값
                        pdProd.couponUseYn,                    // 쿠폰 사용 가능 여부 — {Y: '예', N: '아니오'}
                        pdProd.saveUseYn,                      // 적립금 사용 가능 여부 — {Y: '예', N: '아니오'}
                        pdProd.discntUseYn,                    // 할인 적용 가능 여부 — {Y: '예', N: '아니오'}
                        pdProd.advrtStmt,                  // 홍보문구
                        pdProd.advrtStartDate,              // 홍보문구 시작일시
                        pdProd.advrtEndDate,                // 홍보문구 종료일시
                        pdProd.simulYn,                        // 시뮬데이터여부 — {Y: '예', N: '아니오'}
                        pdProd.prodOptStdCd,                // 옵션 표준코드
                        pdProd.prodOpt1TypeCd,              // 옵션유형1 분류코드
                        pdProd.prodOpt2TypeCd,              // 옵션유형2 분류코드
                        pdProd.regBy,      // 등록자
                        pdProd.regDate,    // 등록일시
                        pdProd.updBy,      // 수정자
                        pdProd.updDate,    // 수정일시
                        // joined
                        pdCategory.categoryNm.as("cateNm"),                     // 카테고리명 (조인)
                        pdCategory.parentCategoryId.as("parentCategoryId"),     // 상위 카테고리ID (조인)
                        syBrand.brandNm.as("brandNm"),                          // 브랜드명 (조인)
                        syVendor.vendorNm.as("vendorNm"),                       // 업체명 (조인)
                        syVendor.vendorPhone.as("vendorTel"),                   // 업체 전화번호 (조인)
                        syUser.userNm.as("mdUserNm"),                            // 담당MD명 (조인)
                        codeProdStatusCd.codeLabel.as("prodStatusCdNm"),                     // 상품상태 코드라벨 (조인)
                        codeProdTypeCd.codeLabel.as("prodTypeCdNm"),                       // 상품유형 코드라벨 (조인)
                        codeSizeInfoCd.codeLabel.as("sizeInfoCdNm"),                        // 사이즈 코드라벨 (조인)
                        pdProd.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdProd.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").from(pdProd)
                .leftJoin(pdCategory).on(pdCategory.categoryId.eq(pdProd.categoryId)) // 카테고리
                .leftJoin(syBrand).on(syBrand.brandId.eq(pdProd.brandId)) // 브랜드
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pdProd.vendorId)) // 업체
                .leftJoin(syUser).on(syUser.userId.eq(pdProd.mdUserId)) // 사용자
                .leftJoin(codeProdStatusCd).on(codeProdStatusCd.codeGrp.eq("PROD_STATUS_CD").and(codeProdStatusCd.codeValue.eq(pdProd.prodStatusCd))) // 상품상태
                .leftJoin(codeProdTypeCd).on(codeProdTypeCd.codeGrp.eq("PROD_TYPE_CD").and(codeProdTypeCd.codeValue.eq(pdProd.prodTypeCd))) // 상품유형
                .leftJoin(codeSizeInfoCd).on(codeSizeInfoCd.codeGrp.eq("SIZE_INFO_CD").and(codeSizeInfoCd.codeValue.eq(pdProd.sizeInfoCd))) // 사이즈
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdProd.regSiteId)) // 등록사이트
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdProd.siteId)) // 사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdProd.regBy)) // 등록자
                .where(pdProd.prodId.eq(prodId))
                .fetchOne()
                ;
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PdProdDto.Item> selectList(PdProdDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();

        whereList.add(QdslUtil.strIn(pdProd.prodId, search.getProdIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pdProd.prodId, search.getProdId())); // 상품ID 필터

        /* 브랜드 — brandId 가 있으면 ID 로, 없고 brandNm 만 있으면 브랜드명 LIKE 로 EXISTS */
        if (StringUtils.hasText(search.getBrandId()) || StringUtils.hasText(search.getBrandNm())) {
            whereList.add(JPAExpressions.selectOne().from(syBrandEx)
                    .where(syBrandEx.brandId.eq(pdProd.brandId),
                           QdslUtil.strEq(syBrandEx.brandId, search.getBrandId()),
                           StringUtils.hasText(search.getBrandId()) ? null : QdslUtil.strLike(syBrandEx.brandNm, search.getBrandNm()))
                    .exists());
        }

        /* 업체 — vendorId 가 있으면 ID 로, 없고 vendorNm 만 있으면 업체명 LIKE 로 EXISTS */
        if (StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm())) {
            whereList.add(JPAExpressions.selectOne().from(syVendorEx)
                    .where(syVendorEx.vendorId.eq(pdProd.vendorId),
                           QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                           StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                    .exists());
        }

        /* 담당MD — mdUserId 가 있으면 ID 로, 없고 mdUserNm 만 있으면 사용자명 LIKE 로 EXISTS */
        if (StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm())) {
            whereList.add(JPAExpressions.selectOne().from(syUserEx)
                    .where(syUserEx.userId.eq(pdProd.mdUserId),
                           QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                           StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                    .exists());
        }

        whereList.add(QdslUtil.strEq(pdProd.prodStatusCd, search.getProdStatusCd())); // 상품상태 단건 필터 (strEq)
        whereList.add(QdslUtil.strIn(pdProd.prodStatusCd, search.getProdStatusCds())); // 상품상태 다중 필터 (strIn, BO multiCheck)
        whereList.add(QdslUtil.strEq(pdProd.prodTypeCd, search.getProdTypeCd())); // 상품유형 필터

        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProd.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProd.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);

        whereList.add(andCurrentYnProd(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProd.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdProdDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PdProdDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<PdProdDto.Item> selectPageData(PdProdDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();

        whereList.add(QdslUtil.strIn(pdProd.prodId, search.getProdIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pdProd.prodId, search.getProdId())); // 상품ID 필터

        /* 브랜드 — brandId 가 있으면 ID 로, 없고 brandNm 만 있으면 브랜드명 LIKE 로 EXISTS */
        if (StringUtils.hasText(search.getBrandId()) || StringUtils.hasText(search.getBrandNm())) {
            whereList.add(JPAExpressions.selectOne().from(syBrandEx)
                    .where(syBrandEx.brandId.eq(pdProd.brandId),
                           QdslUtil.strEq(syBrandEx.brandId, search.getBrandId()),
                           StringUtils.hasText(search.getBrandId()) ? null : QdslUtil.strLike(syBrandEx.brandNm, search.getBrandNm()))
                    .exists());
        }

        /* 업체 — vendorId 가 있으면 ID 로, 없고 vendorNm 만 있으면 업체명 LIKE 로 EXISTS */
        if (StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm())) {
            whereList.add(JPAExpressions.selectOne().from(syVendorEx)
                    .where(syVendorEx.vendorId.eq(pdProd.vendorId),
                           QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                           StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                    .exists());
        }

        /* 담당MD — mdUserId 가 있으면 ID 로, 없고 mdUserNm 만 있으면 사용자명 LIKE 로 EXISTS */
        if (StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm())) {
            whereList.add(JPAExpressions.selectOne().from(syUserEx)
                    .where(syUserEx.userId.eq(pdProd.mdUserId),
                           QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                           StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                    .exists());
        }

        whereList.add(QdslUtil.strEq(pdProd.prodStatusCd, search.getProdStatusCd())); // 상품상태 단건 필터 (strEq)
        whereList.add(QdslUtil.strIn(pdProd.prodStatusCd, search.getProdStatusCds())); // 상품상태 다중 필터 (strIn, BO multiCheck)
        whereList.add(QdslUtil.strEq(pdProd.prodTypeCd, search.getProdTypeCd())); // 상품유형 필터

        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProd.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdProd.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);

        whereList.add(andCurrentYnProd(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdProd.siteId, search.getSiteId())); // 사이트ID 필터

        /* list/count 가 동일 조건을 공유하도록 배열로 1회 변환 */
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdProdDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdProdDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdProd.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdProdDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** 검색조건 빌드 — Mapper XML pdProdCond 와 동일 동작 */
    /**
     * currentYn='Y' 일 때만 "지금 노출 대상" 조건 — 상태 ACTIVE(전시중) AND 전시기간
     * (disp_start_date~disp_end_date) 이내. 2026-08-23 재정리: PROD_STATUS_CD 를 DRAFT/ACTIVE/
     * INACTIVE/ENDED 4종으로 단순화하면서, 예전 SCHEDULED(판매예정)·SOLDOUT(품절)은 별도 상태가
     * 아니라 ACTIVE 하나로 흡수됐다 — 노출 여부는 이 조건 하나로 끝나고, ACTIVE 안에서
     * "판매예정/판매중/품절" 세부 구분은 상태가 아니라 판매기간(sale_start_date~sale_end_date)과
     * 재고(sold_out_yn)를 FO 가 응답 시점에 직접 계산해 배지로만 보여준다 — 상세 → FoPdProdService.
     *
     * <p>FO 는 FoPdProdService 가 요청마다 currentYn='Y' 를 강제 세팅하므로 항상 적용된다(끌 수 없음).
     * BO 는 기본 미적용(전체 조회)이며, "지금 노출중인 것만" 미리보기 시에만 'Y' 를 보낸다.
     * 기준시각은 메서드 진입 시 1회 계산해 시작/종료 비교가 동일 시점을 공유하게 한다.
     *
     * <p>disp_start_date 는 NOT NULL(등록 시 자동으로 현재시각 채움 — "즉시"를 NULL 대신 실제 시각으로
     * 표현)이라 시작일 쪽은 IS NULL 분기 없이 단순 비교만 하면 된다. 종료일(disp_end_date)은 여전히
     * NULL=무기한 허용이라 그 분기만 남긴다.
     */
    private BooleanExpression andCurrentYnProd(String currentYn) {
        if (!"Y".equals(currentYn)) return null;
        LocalDateTime now = LocalDateTime.now();
        return pdProd.dispStartDate.loe(now)
                .and(pdProd.dispEndDate.isNull().or(pdProd.dispEndDate.goe(now)))
                .and(pdProd.prodStatusCd.eq("ACTIVE"));
    }

    /* searchType 예: "adltYn,advrtStmt,brandId,categoryId,contentHtml" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("adltYn", pdProd.adltYn), // 성인상품 여부 Y/N
            QdslUtil.FieldDef.like("advrtStmt", pdProd.advrtStmt), // 홍보문구 (500자 이내)
            QdslUtil.FieldDef.like("brandId", pdProd.brandId), // 브랜드ID 필터
            QdslUtil.FieldDef.like("categoryId", pdProd.categoryId), // 카테고리ID 필터
            QdslUtil.FieldDef.like("contentHtml", pdProd.contentHtml), // 상세설명 (HTML)
            QdslUtil.FieldDef.like("couponUseYn", pdProd.couponUseYn), // 쿠폰 사용 가능 여부 Y/N
            QdslUtil.FieldDef.like("discntUseYn", pdProd.discntUseYn), // 할인 적용 가능 여부 Y/N
            QdslUtil.FieldDef.like("dlivTmpltId", pdProd.dlivTmpltId), // 배송템플릿ID (pd_dliv_tmplt.dliv_tmplt_id)
            QdslUtil.FieldDef.like("isBest", pdProd.isBest), // 베스트여부 Y/N
            QdslUtil.FieldDef.like("isNew", pdProd.isNew), // 신상품여부 Y/N
            QdslUtil.FieldDef.like("mdUserId", pdProd.mdUserId), // 담당MD(sy_user.user_id) 필터
            QdslUtil.FieldDef.like("prodCode", pdProd.prodCode), // 상품코드(SKU)
            QdslUtil.FieldDef.like("prodId", pdProd.prodId), // 상품ID 필터
            QdslUtil.FieldDef.like("prodNm", pdProd.prodNm), // 상품명
            QdslUtil.FieldDef.like("prodStatusCd", pdProd.prodStatusCd), // 상품상태 단건 필터 (strEq)
            QdslUtil.FieldDef.like("prodStatusCdBefore", pdProd.prodStatusCdBefore), // 변경 전 상품상태
            QdslUtil.FieldDef.like("prodTypeCd", pdProd.prodTypeCd), // 상품유형 필터
            QdslUtil.FieldDef.like("sameDayDlivYn", pdProd.sameDayDlivYn), // 당일배송여부 Y/N
            QdslUtil.FieldDef.like("saveUseYn", pdProd.saveUseYn), // 적립금 사용 가능 여부 Y/N
            QdslUtil.FieldDef.like("sizeInfoCd", pdProd.sizeInfoCd), // 사이즈 — SIZE_INFO_CD {FREE:FREE, XS:XS, S:S, M:M, L:L, XL:XL}
            QdslUtil.FieldDef.like("soldOutYn", pdProd.soldOutYn), // 품절여부 Y/N
            QdslUtil.FieldDef.like("thumbnailUrl", pdProd.thumbnailUrl), // 썸네일URL
            QdslUtil.FieldDef.like("vendorId", pdProd.vendorId) // 업체ID 필터
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("prodId", pdProd.prodId,
                   "prodNm", pdProd.prodNm,
                   "regDate", pdProd.regDate),
        new OrderSpecifier<>(Order.DESC, pdProd.regDate),
        new OrderSpecifier<>(Order.ASC, pdProd.prodId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PdProd entity) {
        if (entity.getProdId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdProd);
        boolean hasAny = false;

        if (entity.getProdStatusCd()       != null) { update.set(pdProd.prodStatusCd,       entity.getProdStatusCd());       hasAny = true; }
        if (entity.getProdStatusCdBefore() != null) { update.set(pdProd.prodStatusCdBefore, entity.getProdStatusCdBefore()); hasAny = true; }
        if (entity.getProdNm()             != null) { update.set(pdProd.prodNm,             entity.getProdNm());             hasAny = true; }
        if (entity.getSalePrice()          != null) { update.set(pdProd.salePrice,          entity.getSalePrice());          hasAny = true; }
        if (entity.getSaleDiscntRate()     != null) { update.set(pdProd.saleDiscntRate,     entity.getSaleDiscntRate());     hasAny = true; }
        if (entity.getSaleDiscntAmt()      != null) { update.set(pdProd.saleDiscntAmt,      entity.getSaleDiscntAmt());      hasAny = true; }
        if (entity.getThumbnailUrl()       != null) { update.set(pdProd.thumbnailUrl,       entity.getThumbnailUrl());       hasAny = true; }
        if (entity.getIsBest()             != null) { update.set(pdProd.isBest,             entity.getIsBest());             hasAny = true; }
        if (entity.getIsNew()              != null) { update.set(pdProd.isNew,              entity.getIsNew());              hasAny = true; }
        if (entity.getSoldOutYn()          != null) { update.set(pdProd.soldOutYn,          entity.getSoldOutYn());          hasAny = true; }
        if (entity.getProdOptStdCd()       != null) { update.set(pdProd.prodOptStdCd,       entity.getProdOptStdCd());       hasAny = true; }
        if (entity.getProdOpt1TypeCd()     != null) { update.set(pdProd.prodOpt1TypeCd,     entity.getProdOpt1TypeCd());     hasAny = true; }
        if (entity.getProdOpt2TypeCd()     != null) { update.set(pdProd.prodOpt2TypeCd,     entity.getProdOpt2TypeCd());     hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pdProd.updBy,              entity.getUpdBy());              hasAny = true; }
        update.set(pdProd.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdProd.prodId.eq(entity.getProdId())).execute();
        return (int) affected;
    }

    /** 판매상태 배치 동기화 대상 — 관리 엔티티 그대로 반환 */
    @Override
    public List<PdProd> selectSyncTargets() {
        return queryFactory.selectFrom(pdProd)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectSyncTargets()")
                .where(pdProd.prodStatusCd.in("ACTIVE", "INACTIVE"))
                .fetch();
    }
}
