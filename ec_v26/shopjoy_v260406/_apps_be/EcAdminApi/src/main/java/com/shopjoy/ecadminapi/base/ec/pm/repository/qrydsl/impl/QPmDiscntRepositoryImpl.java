package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntProd;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** PmDiscnt(할인정책) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntRepositoryImpl implements QPmDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPmDiscnt pmDiscnt = QPmDiscnt.pmDiscnt;    // EXISTS 서브쿼리용 별칭 (사용회원/대상상품/업체/담당MD 필터)
    private static final QPmDiscntUsage discntUsageEx = new QPmDiscntUsage("discnt_usage_ex");
    private static final QMbMember      mbMemberEx    = new QMbMember("mb_member_ex");
    private static final QPmDiscntProd  discntProdEx  = new QPmDiscntProd("discnt_prod_ex");
    private static final QPdProd        pProdEx       = new QPdProd("p_prod_ex");
    private static final QSyVendor      syVendorEx    = new QSyVendor("sy_vendor_ex");
    private static final QSyUser        syUserEx      = new QSyUser("sy_user_ex");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * DISCNT_TYPE      {PROD: '상품할인', ORDER: '주문할인', SHIP: '배송비할인', SHIP_FREE: '무료배송'}
     * DISCNT_TARGET    {ALL: '전체', CATEGORY: '카테고리', PRODUCT: '상품', MEMBER_GRADE: '회원등급'}
     * discntStatusCd   {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'} (코드: DISCNT_STATUS_CD)
     */
    private JPAQuery<PmDiscntDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntDto.Item.class,
                        pmDiscnt.discntId,               // 할인ID (PK, YYMMDDhhmmss+rand4)
                        pmDiscnt.discntNm,                // 할인명
                        pmDiscnt.discntTypeCd,           // 할인유형 — DISCNT_TYPE {PROD, ORDER, SHIP, SHIP_FREE}
                        pmDiscnt.discntValTypeCd,        // 할인방식 — DISCNT_VAL_TYPE {RATE:정률, AMOUNT:정액, SHIP_FREE:해당없음}
                        pmDiscnt.discntTargetCd,         // 할인대상 — DISCNT_TARGET {ALL, CATEGORY, PRODUCT, MEMBER_GRADE}
                        pmDiscnt.discntValue,            // 할인값 (정률이면 %, 정액이면 원)
                        pmDiscnt.minOrderAmt,             // 최소주문금액
                        pmDiscnt.minOrderQty,             // 최소주문수량 (NULL=제한없음)
                        pmDiscnt.maxDiscntAmt,            // 최대할인한도 (NULL=무제한)
                        pmDiscnt.startDate,               // 할인 시작일시
                        pmDiscnt.endDate,                 // 할인 종료일시
                        pmDiscnt.discntStatusCd,         // 상태 — ACTIVE: '활성' / INACTIVE: '비활성' / EXPIRED: '만료' (코드: DISCNT_STATUS_CD)
                        pmDiscnt.discntStatusCdBefore,   // 변경 전 상태
                        pmDiscnt.discntDesc,              // 할인 설명
                        pmDiscnt.memGradeCd,              // 적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)
                        pmDiscnt.selfCdivRate,            // 자사(사이트) 분담율 (%) — 기본 100%
                        pmDiscnt.sellerCdivRate,          // 판매자(업체) 분담율 (%) — 기본 0%
                        pmDiscnt.dvcPcYn,                 // PC 채널 적용여부 Y/N
                        pmDiscnt.dvcMwebYn,               // 모바일WEB 적용여부 Y/N
                        pmDiscnt.dvcMappYn,               // 모바일APP 적용여부 Y/N
                        pmDiscnt.useYn, // 사용여부 필터 Y/N
                        pmDiscnt.vendorId,             // 판매업체
                        pmDiscnt.chargeStaff,          // 판매담당자명
                        pmDiscnt.visibilityTargets,    // 공개대상
                        pmDiscnt.mdUserId,             // 담당MD
                        pmDiscnt.regBy,      // 등록자
                        pmDiscnt.regDate,    // 등록일시
                        pmDiscnt.updBy,      // 수정자
                        pmDiscnt.updDate,    // 수정일시
                        pmDiscnt.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pmDiscnt.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pmDiscnt)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmDiscnt.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmDiscnt.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pmDiscnt.siteId)) // 사이트

                ;
    }

    /* 할인 키조회 */
    @Override
    public Optional<PmDiscntDto.Item> selectById(String discntId) {
        PmDiscntDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmDiscnt.discntId.eq(discntId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 할인 목록조회 */
    @Override
    public List<PmDiscntDto.Item> selectList(PmDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmDiscnt.discntId, search.getDiscntIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pmDiscnt.discntId, search.getDiscntId())); // 할인ID 필터
        whereList.add(QdslUtil.strEq(pmDiscnt.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add(QdslUtil.strEq(pmDiscnt.discntTypeCd, search.getDiscntTypeCd())); // 할인유형 필터
        whereList.add(QdslUtil.strEq(pmDiscnt.discntStatusCd, search.getDiscntStatusCd())); // 상태 필터 — DISCNT_STATUS_CD
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscnt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscnt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andMember(search));
        whereList.add(andProdVendorMd(search));
        whereList.add(andCurrentYnDiscnt(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmDiscnt.siteId, search.getSiteId())); // 사이트ID

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmDiscntDto.Item> query = baseSelColumnQuery()
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
        List<PmDiscntDto.Item> list = query.fetch();
        return list;
    }

    /* 할인 페이지조회 */
    @Override
    public BasePage<PmDiscntDto.Item> selectPageData(PmDiscntDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strIn(pmDiscnt.discntId, search.getDiscntIds())); // PK 다건 IN
        whereList.add(QdslUtil.strEq(pmDiscnt.discntId, search.getDiscntId())); // 할인ID 필터
        whereList.add(QdslUtil.strEq(pmDiscnt.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add(QdslUtil.strEq(pmDiscnt.discntTypeCd, search.getDiscntTypeCd())); // 할인유형 필터
        whereList.add(QdslUtil.strEq(pmDiscnt.discntStatusCd, search.getDiscntStatusCd())); // 상태 필터 — DISCNT_STATUS_CD
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscnt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscnt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andMember(search));
        whereList.add(andProdVendorMd(search));
        whereList.add(andCurrentYnDiscnt(search.getCurrentYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmDiscnt.siteId, search.getSiteId())); // 사이트ID
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmDiscntDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmDiscntDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmDiscnt.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmDiscntDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /** andMember — 사용회원 필터. pm_discnt_usage(discnt_id↔member_id) 에 사용 이력이
     *  있는 회원만 남긴다. discnt_usage.member_id 는 사용 시점 스냅샷이라 mb_member 는
     *  memberNm 검색 시에만 조인한다. */
    private BooleanExpression andMember(PmDiscntDto.Request search) {
        if (!StringUtils.hasText(search.getMemberId()) && !StringUtils.hasText(search.getMemberNm())) return null;
        return JPAExpressions.selectOne().from(discntUsageEx)
            .where(discntUsageEx.discntId.eq(pmDiscnt.discntId),
                   QdslUtil.strEq(discntUsageEx.memberId, search.getMemberId()),
                   StringUtils.hasText(search.getMemberId()) ? null
                       : JPAExpressions.selectOne().from(mbMemberEx)
                             .where(mbMemberEx.memberId.eq(discntUsageEx.memberId), QdslUtil.strLike(mbMemberEx.memberNm, search.getMemberNm())).exists())
            .exists();
    }

    /** andProdVendorMd — 대상상품/업체/담당MD 필터. pm_discnt_prod(discnt_id↔prod_id) 를
     *  거쳐 pd_prod 의 vendor_id/md_user_id 까지 조인해야 하는 2단 EXISTS. */
    private BooleanExpression andProdVendorMd(PmDiscntDto.Request search) {
        boolean needProd   = StringUtils.hasText(search.getProdId()) || StringUtils.hasText(search.getProdNm());
        boolean needVendor = StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm());
        boolean needMd     = StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm());
        if (!needProd && !needVendor && !needMd) return null;

        com.querydsl.jpa.JPQLQuery<Integer> sub = JPAExpressions.selectOne().from(discntProdEx)
            .where(discntProdEx.discntId.eq(pmDiscnt.discntId));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(discntProdEx.prodId, search.getProdId())); // 대상상품 ID 필터 (EXISTS eq via pm_discnt_prod)
        whereList.add(StringUtils.hasText(search.getProdId()) ? null
                : JPAExpressions.selectOne().from(pProdEx)
                      .where(pProdEx.prodId.eq(discntProdEx.prodId), QdslUtil.strLike(pProdEx.prodNm, search.getProdNm())).exists());

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        if (needProd) {
            sub = sub.where(wheres);
        }
        if (needVendor) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syVendorEx).on(syVendorEx.vendorId.eq(pProdEx.vendorId))
                .where(pProdEx.prodId.eq(discntProdEx.prodId),
                       QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                       StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                .exists());
        }
        if (needMd) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syUserEx).on(syUserEx.userId.eq(pProdEx.mdUserId))
                .where(pProdEx.prodId.eq(discntProdEx.prodId),
                       QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                       StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                .exists());
        }
        return sub.exists();
    }

    /**
     * currentYn='Y' 일 때만 "지금 적용중" 조건 — 상태 ACTIVE + use_yn='Y' + 적용기간(start_date~end_date) 이내.
     *
     * <p>FO 는 서비스가 요청마다 currentYn='Y' 를 강제 세팅하므로 항상 적용된다(끔 수 없음).
     * BO 는 기본 미적용(전체 조회)이며, "지금 노출중인 것만" 미리보기 시에만 'Y' 를 보낸다.
     * 기준일은 메서드 진입 시 1회 계산해 두 비교(시작/종료)가 동일 시점을 공유하게 한다.
     */
    private BooleanExpression andCurrentYnDiscnt(String currentYn) {
        if (!"Y".equals(currentYn)) return null;
        LocalDate today = LocalDate.now();
        return pmDiscnt.discntStatusCd.eq("ACTIVE")
                .and(pmDiscnt.useYn.eq("Y"))
                .and(QdslUtil.dateBetween(today, pmDiscnt.startDate, pmDiscnt.endDate));
    }

    /* searchType 예: "discntDesc,discntId,discntNm,discntStatusCd,discntStatusCdBefore" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("discntDesc", pmDiscnt.discntDesc), // 할인 설명
            QdslUtil.FieldDef.like("discntId", pmDiscnt.discntId), // 할인ID 필터
            QdslUtil.FieldDef.like("discntNm", pmDiscnt.discntNm), // 할인명
            QdslUtil.FieldDef.like("discntStatusCd", pmDiscnt.discntStatusCd), // 상태 필터 — DISCNT_STATUS_CD
            QdslUtil.FieldDef.like("discntStatusCdBefore", pmDiscnt.discntStatusCdBefore), // 변경 전 상태
            QdslUtil.FieldDef.like("discntTargetCd", pmDiscnt.discntTargetCd), // 할인대상 — DISCNT_TARGET_CD
            QdslUtil.FieldDef.like("discntTypeCd", pmDiscnt.discntTypeCd), // 할인유형 필터
            QdslUtil.FieldDef.like("dvcMappYn", pmDiscnt.dvcMappYn), // 모바일APP 적용여부 Y/N
            QdslUtil.FieldDef.like("dvcMwebYn", pmDiscnt.dvcMwebYn), // 모바일WEB 적용여부 Y/N
            QdslUtil.FieldDef.like("dvcPcYn", pmDiscnt.dvcPcYn), // PC 채널 적용여부 Y/N
            QdslUtil.FieldDef.like("memGradeCd", pmDiscnt.memGradeCd), // 적용 회원등급 코드 (NULL=전체)
            QdslUtil.FieldDef.like("useYn", pmDiscnt.useYn) // 사용여부 필터 Y/N
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("discntId", pmDiscnt.discntId,
                   "discntNm", pmDiscnt.discntNm,
                   "regDate", pmDiscnt.regDate),
        new OrderSpecifier<>(Order.DESC, pmDiscnt.regDate),
        new OrderSpecifier<>(Order.ASC, pmDiscnt.discntId));
    }

    /* 할인 수정 */
    @Override
    public int updateSelective(PmDiscnt entity) {
        if (entity.getDiscntId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscnt);
        boolean hasAny = false;

        if (entity.getDiscntNm()             != null) { update.set(pmDiscnt.discntNm,             entity.getDiscntNm());             hasAny = true; }
        if (entity.getDiscntTypeCd()         != null) { update.set(pmDiscnt.discntTypeCd,         entity.getDiscntTypeCd());         hasAny = true; }
        if (entity.getDiscntTargetCd()       != null) { update.set(pmDiscnt.discntTargetCd,       entity.getDiscntTargetCd());       hasAny = true; }
        if (entity.getDiscntValue()          != null) { update.set(pmDiscnt.discntValue,          entity.getDiscntValue());          hasAny = true; }
        if (entity.getMinOrderAmt()          != null) { update.set(pmDiscnt.minOrderAmt,          entity.getMinOrderAmt());          hasAny = true; }
        if (entity.getMinOrderQty()          != null) { update.set(pmDiscnt.minOrderQty,          entity.getMinOrderQty());          hasAny = true; }
        if (entity.getMaxDiscntAmt()         != null) { update.set(pmDiscnt.maxDiscntAmt,         entity.getMaxDiscntAmt());         hasAny = true; }
        if (entity.getStartDate()            != null) { update.set(pmDiscnt.startDate,            entity.getStartDate());            hasAny = true; }
        if (entity.getEndDate()              != null) { update.set(pmDiscnt.endDate,              entity.getEndDate());              hasAny = true; }
        if (entity.getDiscntStatusCd()       != null) { update.set(pmDiscnt.discntStatusCd,       entity.getDiscntStatusCd());       hasAny = true; }
        if (entity.getDiscntStatusCdBefore() != null) { update.set(pmDiscnt.discntStatusCdBefore, entity.getDiscntStatusCdBefore()); hasAny = true; }
        if (entity.getDiscntDesc()           != null) { update.set(pmDiscnt.discntDesc,           entity.getDiscntDesc());           hasAny = true; }
        if (entity.getMemGradeCd()           != null) { update.set(pmDiscnt.memGradeCd,           entity.getMemGradeCd());           hasAny = true; }
        if (entity.getSelfCdivRate()         != null) { update.set(pmDiscnt.selfCdivRate,         entity.getSelfCdivRate());         hasAny = true; }
        if (entity.getSellerCdivRate()       != null) { update.set(pmDiscnt.sellerCdivRate,       entity.getSellerCdivRate());       hasAny = true; }
        if (entity.getDvcPcYn()              != null) { update.set(pmDiscnt.dvcPcYn,              entity.getDvcPcYn());              hasAny = true; }
        if (entity.getDvcMwebYn()            != null) { update.set(pmDiscnt.dvcMwebYn,            entity.getDvcMwebYn());            hasAny = true; }
        if (entity.getDvcMappYn()            != null) { update.set(pmDiscnt.dvcMappYn,            entity.getDvcMappYn());            hasAny = true; }
        if (entity.getUseYn()                != null) { update.set(pmDiscnt.useYn,                entity.getUseYn());                hasAny = true; }
        if (entity.getVendorId()             != null) { update.set(pmDiscnt.vendorId,             entity.getVendorId());             hasAny = true; }
        if (entity.getChargeStaff()          != null) { update.set(pmDiscnt.chargeStaff,          entity.getChargeStaff());          hasAny = true; }
        if (entity.getVisibilityTargets()    != null) { update.set(pmDiscnt.visibilityTargets,    entity.getVisibilityTargets());    hasAny = true; }
        if (entity.getMdUserId()             != null) { update.set(pmDiscnt.mdUserId,             entity.getMdUserId());             hasAny = true; }
        if (entity.getUpdBy()                != null) { update.set(pmDiscnt.updBy,                entity.getUpdBy());                hasAny = true; }
        update.set(pmDiscnt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmDiscnt.discntId.eq(entity.getDiscntId())).execute();
        return (int) affected;
    }

    /** 상태 배치 동기화 대상 — 관리 엔티티 그대로 반환 */
    @Override
    public List<PmDiscnt> selectSyncTargets() {
        return queryFactory.selectFrom(pmDiscnt)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectSyncTargets()")
                .where(pmDiscnt.useYn.eq("Y"), pmDiscnt.discntStatusCd.eq("ACTIVE"))
                .fetch();
    }
}
