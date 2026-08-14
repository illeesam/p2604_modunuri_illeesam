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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmDiscnt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntRepositoryImpl implements QPmDiscntRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntRepositoryImpl";
    private static final QPmDiscnt pmDiscnt = QPmDiscnt.pmDiscnt;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", pmDiscnt.regDate,
        "upd_date", pmDiscnt.updDate
    );
    // EXISTS 서브쿼리용 별칭 (사용회원/대상상품/업체/담당MD 필터)
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
                        pmDiscnt.useYn,
                        pmDiscnt.vendorId,             // 판매업체
                        pmDiscnt.chargeStaff,          // 판매담당자명
                        pmDiscnt.visibilityTargets,    // 공개대상
                        pmDiscnt.mdUserId,             // 담당MD
                        pmDiscnt.regBy, pmDiscnt.regDate, pmDiscnt.updBy, pmDiscnt.updDate
                ))
                .from(pmDiscnt);
    }

    /* 할인 키조회 */
    @Override
    public Optional<PmDiscntDto.Item> selectById(String discntId) {
        PmDiscntDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmDiscnt.discntId.eq(discntId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 할인 목록조회 */
    @Override
    public List<PmDiscntDto.Item> selectList(PmDiscntDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmDiscntDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pmDiscnt.discntId, search.getDiscntIds()),
                    QdslUtil.strEq(pmDiscnt.discntId, search.getDiscntId()),
                    QdslUtil.strEq(pmDiscnt.useYn, search.getUseYn()),
                    QdslUtil.strEq(pmDiscnt.discntTypeCd, search.getDiscntTypeCd()),
                    QdslUtil.strEq(pmDiscnt.discntStatusCd, search.getDiscntStatusCd()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                    andMember(search), andProdVendorMd(search),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 할인 페이지조회 */
    @Override
    public BasePage<PmDiscntDto.Item> selectPageData(PmDiscntDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pmDiscnt.discntId, search.getDiscntIds()),
                QdslUtil.strEq(pmDiscnt.discntId, search.getDiscntId()),
                QdslUtil.strEq(pmDiscnt.useYn, search.getUseYn()),
                QdslUtil.strEq(pmDiscnt.discntTypeCd, search.getDiscntTypeCd()),
                QdslUtil.strEq(pmDiscnt.discntStatusCd, search.getDiscntStatusCd()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andMember(search), andProdVendorMd(search),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmDiscntDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmDiscntDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmDiscnt.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmDiscntDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
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

        if (needProd) {
            sub = sub.where(
                QdslUtil.strEq(discntProdEx.prodId, search.getProdId()),
                StringUtils.hasText(search.getProdId()) ? null
                    : JPAExpressions.selectOne().from(pProdEx)
                          .where(pProdEx.prodId.eq(discntProdEx.prodId), QdslUtil.strLike(pProdEx.prodNm, search.getProdNm())).exists());
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

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("discntDesc", pmDiscnt.discntDesc),
            QdslUtil.FieldDef.like("discntId", pmDiscnt.discntId),
            QdslUtil.FieldDef.like("discntNm", pmDiscnt.discntNm),
            QdslUtil.FieldDef.like("discntStatusCd", pmDiscnt.discntStatusCd),
            QdslUtil.FieldDef.like("discntStatusCdBefore", pmDiscnt.discntStatusCdBefore),
            QdslUtil.FieldDef.like("discntTargetCd", pmDiscnt.discntTargetCd),
            QdslUtil.FieldDef.like("discntTypeCd", pmDiscnt.discntTypeCd),
            QdslUtil.FieldDef.like("dvcMappYn", pmDiscnt.dvcMappYn),
            QdslUtil.FieldDef.like("dvcMwebYn", pmDiscnt.dvcMwebYn),
            QdslUtil.FieldDef.like("dvcPcYn", pmDiscnt.dvcPcYn),
            QdslUtil.FieldDef.like("memGradeCd", pmDiscnt.memGradeCd),
            QdslUtil.FieldDef.like("useYn", pmDiscnt.useYn)
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmDiscnt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmDiscnt.discntId.eq(entity.getDiscntId())).execute();
        return (int) affected;
    }
}
