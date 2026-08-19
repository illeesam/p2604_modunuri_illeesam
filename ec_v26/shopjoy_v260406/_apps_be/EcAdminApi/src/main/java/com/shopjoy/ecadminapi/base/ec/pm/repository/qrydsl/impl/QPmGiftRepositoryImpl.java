package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftRepository;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PmGift QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftRepositoryImpl implements QPmGiftRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftRepositoryImpl";
    private static final QPmGift  pmGift    = QPmGift.pmGift;
    private static final QPdProd  pdProd  = QPdProd.pdProd;
    private static final QSySite  sySite  = QSySite.sySite;
    private static final QSyVendor syVendor = QSyVendor.syVendor;
    private static final QSyUser   syUser   = QSyUser.syUser;
    private static final QVwSyCode  cdGt = new QVwSyCode("cd_gt");
    private static final QVwSyCode  cdGs = new QVwSyCode("cd_gs");
    private static final QVwSyCode  cdMg = new QVwSyCode("cd_mg");
    // EXISTS 서브쿼리용 별칭 (발급회원 필터 — pm_gift_issue → mb_member)
    private static final QPmGiftIssue giftIssueEx = new QPmGiftIssue("gift_issue_ex");
    private static final QMbMember    mbMemberEx  = new QMbMember("mb_member_ex");    /**
     * 공통 base query — JOIN 일치, Item 필드만 projection
     *
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GIFT_TYPE    {PRODUCT: '상품', SAMPLE: '샘플', ETC: '기타'}
     * GIFT_STATUS  {ACTIVE: '활성', INACTIVE: '비활성'}
     */
    private JPAQuery<PmGiftDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftDto.Item.class,
                        pmGift.giftId,               // 사은품ID (PK, YYMMDDhhmmss+rand4)
                        pmGift.giftNm,               // 사은품명
                        pmGift.giftTypeCd,           // 사은품유형 — GIFT_TYPE {PRODUCT: '상품', SAMPLE: '샘플', ETC: '기타'}
                        pmGift.prodId,               // 연결 상품ID (pd_prod.prod_id)
                        pmGift.giftStock,            // 사은품 재고
                        pmGift.giftDesc,             // 사은품 설명
                        pmGift.startDate,            // 시작일시
                        pmGift.endDate,              // 종료일시
                        pmGift.giftStatusCd,         // 상태 — GIFT_STATUS {ACTIVE: '활성', INACTIVE: '비활성'}
                        pmGift.giftStatusCdBefore,   // 변경 전 상태
                        pmGift.memGradeCd,           // 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
                        pmGift.minOrderAmt,          // 최소주문금액 — 사은품 지급 기준 금액
                        pmGift.minOrderQty,          // 최소주문수량 (NULL=제한없음)
                        pmGift.selfCdivRate,         // 자사(사이트) 분담율 (%) — 기본 100%
                        pmGift.sellerCdivRate,       // 판매자(업체) 분담율 (%) — 기본 0%
                        pmGift.useYn, pmGift.regBy, pmGift.regDate, pmGift.updBy, pmGift.updDate,
                        pmGift.vendorId,            // 판매업체 (sy_vendor.vendor_id)
                        pmGift.chargeStaff,         // 판매담당자명
                        pmGift.visibilityTargets    // 공개대상
                ))
                .from(pmGift)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pmGift.prodId)) // 상품
                .leftJoin(syVendor).on(syVendor.vendorId.eq(pdProd.vendorId)) // 업체
                .leftJoin(syUser).on(syUser.userId.eq(pdProd.mdUserId)) // 사용자
                .leftJoin(cdGt).on(cdGt.codeGrp.eq("GIFT_TYPE_CD").and(cdGt.codeValue.eq(pmGift.giftTypeCd))) // 사은품유형
                .leftJoin(cdGs).on(cdGs.codeGrp.eq("GIFT_STATUS_CD").and(cdGs.codeValue.eq(pmGift.giftStatusCd))) // 사은품상태
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(pmGift.memGradeCd))) // 회원등급
                ;
    }

    /** 단건 조회 */
    @Override
    public Optional<PmGiftDto.Item> selectById(String giftId) {
        PmGiftDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmGift.giftId.eq(giftId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    @Override
    public List<PmGiftDto.Item> selectList(PmGiftDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmGift.giftId, search.getGiftId()));
        whereList.add(QdslUtil.strEq(pmGift.giftTypeCd, search.getGiftTypeCd()));
        whereList.add(QdslUtil.strEq(pmGift.giftStatusCd, search.getGiftStatusCd()));
        whereList.add(QdslUtil.strEq(pmGift.useYn, search.getUseYn()));
        whereList.add(QdslUtil.strEq(pmGift.prodId, search.getProdId()));
        whereList.add(QdslUtil.strEq(pdProd.vendorId, search.getVendorId()));
        whereList.add(QdslUtil.strLike(syVendor.vendorNm, search.getVendorNm()));
        whereList.add(QdslUtil.strEq(pdProd.mdUserId, search.getMdUserId()));
        whereList.add(QdslUtil.strLike(syUser.userNm, search.getMdUserNm()));
        whereList.add(andMember(search));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGift.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGift.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andCurrentYnGift(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmGiftDto.Item> query = baseSelColumnQuery()
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
        List<PmGiftDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<PmGiftDto.Item> selectPageData(PmGiftDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmGift.giftId, search.getGiftId()));
        whereList.add(QdslUtil.strEq(pmGift.giftTypeCd, search.getGiftTypeCd()));
        whereList.add(QdslUtil.strEq(pmGift.giftStatusCd, search.getGiftStatusCd()));
        whereList.add(QdslUtil.strEq(pmGift.useYn, search.getUseYn()));
        whereList.add(/* ⚠ prodId 가 selectList() 에는 있는데 여기(selectPageData)엔 빠져 있었다
               — 페이지 조회 모드에서만 상품 필터가 무시되던 기존 버그. 같이 정정. */
            QdslUtil.strEq(pmGift.prodId, search.getProdId()));
        whereList.add(QdslUtil.strEq(pdProd.vendorId, search.getVendorId()));
        whereList.add(QdslUtil.strLike(syVendor.vendorNm, search.getVendorNm()));
        whereList.add(QdslUtil.strEq(pdProd.mdUserId, search.getMdUserId()));
        whereList.add(QdslUtil.strLike(syUser.userNm, search.getMdUserNm()));
        whereList.add(andMember(search));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGift.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGift.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andCurrentYnGift(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmGiftDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmGiftDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmGift.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmGiftDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** andMember — 발급회원 필터. pm_gift_issue(gift_id↔member_id) 에 발급 이력이
     *  있는 회원만 남긴다. */
    private BooleanExpression andMember(PmGiftDto.Request search) {
        if (!StringUtils.hasText(search.getMemberId()) && !StringUtils.hasText(search.getMemberNm())) return null;
        return JPAExpressions.selectOne().from(giftIssueEx)
            .where(giftIssueEx.giftId.eq(pmGift.giftId),
                   QdslUtil.strEq(giftIssueEx.memberId, search.getMemberId()),
                   StringUtils.hasText(search.getMemberId()) ? null
                       : JPAExpressions.selectOne().from(mbMemberEx)
                             .where(mbMemberEx.memberId.eq(giftIssueEx.memberId), QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm())).exists())
            .exists();
    }

    /** 검색조건 빌드 — Mapper XML pmGiftCond 와 동일 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    /**
     * currentYn='Y' 일 때만 "지금 지급중" 조건 — 상태 ACTIVE + use_yn='Y' + 지급기간(start_date~end_date) 이내.
     *
     * <p>FO 는 서비스가 요청마다 currentYn='Y' 를 강제 세팅하므로 항상 적용된다(끔 수 없음).
     * BO 는 기본 미적용(전체 조회)이며, "지금 노출중인 것만" 미리보기 시에만 'Y' 를 보낸다.
     * 기준일은 메서드 진입 시 1회 계산해 두 비교(시작/종료)가 동일 시점을 공유하게 한다.
     */
    private BooleanExpression andCurrentYnGift(String currentYn) {
        if (!"Y".equals(currentYn)) return null;
        LocalDate today = LocalDate.now();
        return pmGift.giftStatusCd.eq("ACTIVE")
                .and(pmGift.useYn.eq("Y"))
                .and(QdslUtil.dateBetween(today, pmGift.startDate, pmGift.endDate));
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("giftDesc", pmGift.giftDesc),
            QdslUtil.FieldDef.like("giftId", pmGift.giftId),
            QdslUtil.FieldDef.like("giftNm", pmGift.giftNm),
            QdslUtil.FieldDef.like("giftStatusCd", pmGift.giftStatusCd),
            QdslUtil.FieldDef.like("giftStatusCdBefore", pmGift.giftStatusCdBefore),
            QdslUtil.FieldDef.like("giftTypeCd", pmGift.giftTypeCd),
            QdslUtil.FieldDef.like("memGradeCd", pmGift.memGradeCd),
            QdslUtil.FieldDef.like("prodId", pmGift.prodId),
            QdslUtil.FieldDef.like("useYn", pmGift.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("giftId", pmGift.giftId,
                   "giftNm", pmGift.giftNm,
                   "regDate", pmGift.regDate),
        new OrderSpecifier<>(Order.DESC, pmGift.regDate),
        new OrderSpecifier<>(Order.ASC, pmGift.giftId));
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(PmGift entity) {
        if (entity.getGiftId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGift);
        boolean hasAny = false;

        if (entity.getGiftNm()             != null) { update.set(pmGift.giftNm,             entity.getGiftNm());             hasAny = true; }
        if (entity.getGiftTypeCd()         != null) { update.set(pmGift.giftTypeCd,         entity.getGiftTypeCd());         hasAny = true; }
        if (entity.getProdId()             != null) { update.set(pmGift.prodId,             entity.getProdId());             hasAny = true; }
        if (entity.getGiftStock()          != null) { update.set(pmGift.giftStock,          entity.getGiftStock());          hasAny = true; }
        if (entity.getGiftDesc()           != null) { update.set(pmGift.giftDesc,           entity.getGiftDesc());           hasAny = true; }
        if (entity.getStartDate()          != null) { update.set(pmGift.startDate,          entity.getStartDate());          hasAny = true; }
        if (entity.getEndDate()            != null) { update.set(pmGift.endDate,            entity.getEndDate());            hasAny = true; }
        if (entity.getGiftStatusCd()       != null) { update.set(pmGift.giftStatusCd,       entity.getGiftStatusCd());       hasAny = true; }
        if (entity.getGiftStatusCdBefore() != null) { update.set(pmGift.giftStatusCdBefore, entity.getGiftStatusCdBefore()); hasAny = true; }
        if (entity.getMemGradeCd()         != null) { update.set(pmGift.memGradeCd,         entity.getMemGradeCd());         hasAny = true; }
        if (entity.getMinOrderAmt()        != null) { update.set(pmGift.minOrderAmt,        entity.getMinOrderAmt());        hasAny = true; }
        if (entity.getMinOrderQty()        != null) { update.set(pmGift.minOrderQty,        entity.getMinOrderQty());        hasAny = true; }
        if (entity.getSelfCdivRate()       != null) { update.set(pmGift.selfCdivRate,       entity.getSelfCdivRate());       hasAny = true; }
        if (entity.getSellerCdivRate()     != null) { update.set(pmGift.sellerCdivRate,     entity.getSellerCdivRate());     hasAny = true; }
        if (entity.getUseYn()              != null) { update.set(pmGift.useYn,              entity.getUseYn());              hasAny = true; }
        if (entity.getVendorId()           != null) { update.set(pmGift.vendorId,           entity.getVendorId());           hasAny = true; }
        if (entity.getChargeStaff()        != null) { update.set(pmGift.chargeStaff,        entity.getChargeStaff());        hasAny = true; }
        if (entity.getVisibilityTargets()  != null) { update.set(pmGift.visibilityTargets,  entity.getVisibilityTargets());  hasAny = true; }
        if (entity.getUpdBy()              != null) { update.set(pmGift.updBy,              entity.getUpdBy());              hasAny = true; }
        update.set(pmGift.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmGift.giftId.eq(entity.getGiftId())).execute();
        return (int) affected;
    }
}
