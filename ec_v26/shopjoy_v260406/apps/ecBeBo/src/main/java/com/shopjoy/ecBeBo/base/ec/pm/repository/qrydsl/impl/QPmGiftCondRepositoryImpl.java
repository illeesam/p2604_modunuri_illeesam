package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmGiftCondDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmGiftCond;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.QPmGiftCond;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmGiftCondRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** PmGiftCond(사은품 지급 조건) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftCondRepositoryImpl implements QPmGiftCondRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftCondRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPmGiftCond pmGiftCond    = QPmGiftCond.pmGiftCond;
    private static final QPmGift     pmGift  = QPmGift.pmGift;
    private static final QSySite     sySite  = QSySite.sySite;
    private static final QVwSyCode     codeCondTypeCd = new QVwSyCode("cd_gct");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GIFT_COND_TYPE  {ORDER_AMT: '주문금액', PRODUCT: '특정상품', MEMBER_GRADE: '회원등급'}
     * targetTypeCd    {PRODUCT: '상품', CATEGORY: '카테고리', MEMBER_GRADE: '회원등급'} (Entity 주석 기준)
     */
    private JPAQuery<PmGiftCondDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftCondDto.Item.class,
                        pmGiftCond.giftCondId,     // 사은품조건ID (PK)
                        pmGiftCond.giftId,         // 사은품ID (pm_gift.gift_id)
                        pmGiftCond.condTypeCd,     // 조건유형 — GIFT_COND_TYPE {ORDER_AMT: '주문금액', PRODUCT: '특정상품', MEMBER_GRADE: '회원등급'}
                        codeCondTypeCd.codeLabel.as("condTypeCdNm"), // 코드 라벨
                        pmGiftCond.minOrderAmt,    // 최소주문금액 (ORDER_AMT 조건)
                        pmGiftCond.targetTypeCd,   // 대상유형 — PRODUCT/CATEGORY/MEMBER_GRADE
                        pmGiftCond.targetId,       // 대상ID
                        pmGift.startDate.as("applyStartDate"),  // 적용시작일 (pm_gift.start_date, 조인)
                        pmGift.endDate.as("applyEndDate"),      // 적용종료일 (pm_gift.end_date, 조인)
                        pmGiftCond.regBy,  // 등록자
                        pmGiftCond.regDate,  // 등록일시
                        pmGiftCond.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pmGiftCond.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pmGiftCond)
                .innerJoin(pmGift).on(pmGift.giftId.eq(pmGiftCond.giftId)) // 사은품
                .innerJoin(codeCondTypeCd).on(codeCondTypeCd.codeGrp.eq("COND_TYPE_CD").and(codeCondTypeCd.codeValue.eq(pmGiftCond.condTypeCd))) // 조건유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmGiftCond.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmGiftCond.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pmGiftCond.siteId)) // 사이트

                ;
    }

    /* 사은품 지급 조건 키조회 */
    @Override
    public Optional<PmGiftCondDto.Item> selectById(String giftCondId) {
        PmGiftCondDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmGiftCond.giftCondId.eq(giftCondId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 사은품 지급 조건 목록조회 */
    @Override
    public List<PmGiftCondDto.Item> selectList(PmGiftCondDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmGiftCond.giftCondId, search.getGiftCondId())); // 사은품조건ID 필터
        whereList.add(QdslUtil.strEq(pmGiftCond.giftId, search.getGiftId())); // 사은품ID 필터 (pm_gift.gift_id)
        whereList.add(QdslUtil.strEq(pmGiftCond.targetTypeCd, search.getTargetTypeCd())); // 대상유형 필터 (PRODUCT/CATEGORY/MEMBER_GRADE)
        whereList.add(QdslUtil.strEq(pmGiftCond.targetId, search.getTargetId())); // 대상ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftCond.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftCond.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmGiftCond.siteId, search.getSiteId())); // 사이트ID

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmGiftCondDto.Item> query = baseSelColumnQuery()
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
        List<PmGiftCondDto.Item> list = query.fetch();
        return list;
    }

    /* 사은품 지급 조건 페이지조회 */
    @Override
    public BasePage<PmGiftCondDto.Item> selectPageData(PmGiftCondDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmGiftCond.giftCondId, search.getGiftCondId())); // 사은품조건ID 필터
        whereList.add(QdslUtil.strEq(pmGiftCond.giftId, search.getGiftId())); // 사은품ID 필터 (pm_gift.gift_id)
        whereList.add(QdslUtil.strEq(pmGiftCond.targetTypeCd, search.getTargetTypeCd())); // 대상유형 필터 (PRODUCT/CATEGORY/MEMBER_GRADE)
        whereList.add(QdslUtil.strEq(pmGiftCond.targetId, search.getTargetId())); // 대상ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftCond.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmGiftCond.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmGiftCond.siteId, search.getSiteId())); // 사이트ID
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmGiftCondDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmGiftCondDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmGiftCond.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmGiftCondDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "condTypeCd,giftCondId,giftId,targetId,targetTypeCd" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("condTypeCd", pmGiftCond.condTypeCd), // 조건유형 — COND_TYPE_CD
            QdslUtil.FieldDef.like("giftCondId", pmGiftCond.giftCondId), // 사은품조건ID 필터
            QdslUtil.FieldDef.like("giftId", pmGiftCond.giftId), // 사은품ID 필터 (pm_gift.gift_id)
            QdslUtil.FieldDef.like("targetId", pmGiftCond.targetId), // 대상ID 필터
            QdslUtil.FieldDef.like("targetTypeCd", pmGiftCond.targetTypeCd) // 대상유형 필터 (PRODUCT/CATEGORY/MEMBER_GRADE)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("giftCondId", pmGiftCond.giftCondId,
                   "regDate", pmGiftCond.regDate),
        new OrderSpecifier<>(Order.DESC, pmGiftCond.regDate),
        new OrderSpecifier<>(Order.ASC, pmGiftCond.giftCondId));
    }

    /* 사은품 지급 조건 수정 */
    @Override
    public int updateSelective(PmGiftCond entity) {
        if (entity.getGiftCondId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmGiftCond);
        boolean hasAny = false;

        if (entity.getGiftId()       != null) { update.set(pmGiftCond.giftId,       entity.getGiftId());       hasAny = true; }
        if (entity.getCondTypeCd()   != null) { update.set(pmGiftCond.condTypeCd,   entity.getCondTypeCd());   hasAny = true; }
        if (entity.getMinOrderAmt()  != null) { update.set(pmGiftCond.minOrderAmt,  entity.getMinOrderAmt());  hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(pmGiftCond.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(pmGiftCond.targetId,     entity.getTargetId());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmGiftCond.giftCondId.eq(entity.getGiftCondId())).execute();
        return (int) affected;
    }
}
