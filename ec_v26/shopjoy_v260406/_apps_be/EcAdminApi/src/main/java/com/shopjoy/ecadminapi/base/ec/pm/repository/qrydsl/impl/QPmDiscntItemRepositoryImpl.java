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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmDiscntItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmDiscntItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmDiscntItem(할인 대상 항목) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmDiscntItemRepositoryImpl implements QPmDiscntItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmDiscntItemRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPmDiscntItem pmDiscntItem = QPmDiscntItem.pmDiscntItem;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * DISCNT_ITEM_TARGET  {CATEGORY: '카테고리', PRODUCT: '상품', MEMBER_GRADE: '회원등급'} (Entity 주석 대상ID 설명 기준)
     */
    private JPAQuery<PmDiscntItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmDiscntItemDto.Item.class,
                        pmDiscntItem.discntItemId,   // 할인항목ID (PK)
                        pmDiscntItem.discntId,       // 할인ID (pm_discnt.discnt_id)
                        pmDiscntItem.targetTypeCd,   // 대상유형 — DISCNT_ITEM_TARGET {CATEGORY, PRODUCT, MEMBER_GRADE}
                        pmDiscntItem.targetId,       // 대상ID (category_id/prod_id/grade_cd)
                        pmDiscntItem.regBy,  // 등록자
                        pmDiscntItem.regDate,  // 등록일시
                        pmDiscntItem.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pmDiscntItem.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pmDiscntItem)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmDiscntItem.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmDiscntItem.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pmDiscntItem.siteId)) // 사이트

                ;
    }

    /* 할인 대상 상품 키조회 */
    @Override
    public Optional<PmDiscntItemDto.Item> selectById(String discntItemId) {
        PmDiscntItemDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmDiscntItem.discntItemId.eq(discntItemId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 할인 대상 상품 목록조회 */
    @Override
    public List<PmDiscntItemDto.Item> selectList(PmDiscntItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmDiscntItem.discntItemId, search.getDiscntItemId())); // 할인항목ID 필터
        whereList.add(QdslUtil.strEq(pmDiscntItem.discntId, search.getDiscntId())); // 할인ID 필터 (pm_discnt.discnt_id)
        whereList.add(QdslUtil.strEq(pmDiscntItem.targetId, search.getTargetId())); // 대상ID 필터 (category_id/prod_id/grade_cd)
        whereList.add(QdslUtil.strEq(pmDiscntItem.targetTypeCd, search.getTargetTypeCd())); // 대상유형 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmDiscntItem.siteId, search.getSiteId())); // 사이트ID

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmDiscntItemDto.Item> query = baseSelColumnQuery()
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
        List<PmDiscntItemDto.Item> list = query.fetch();
        return list;
    }

    /* 할인 대상 상품 페이지조회 */
    @Override
    public BasePage<PmDiscntItemDto.Item> selectPageData(PmDiscntItemDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmDiscntItem.discntItemId, search.getDiscntItemId())); // 할인항목ID 필터
        whereList.add(QdslUtil.strEq(pmDiscntItem.discntId, search.getDiscntId())); // 할인ID 필터 (pm_discnt.discnt_id)
        whereList.add(QdslUtil.strEq(pmDiscntItem.targetId, search.getTargetId())); // 대상ID 필터 (category_id/prod_id/grade_cd)
        whereList.add(QdslUtil.strEq(pmDiscntItem.targetTypeCd, search.getTargetTypeCd())); // 대상유형 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmDiscntItem.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pmDiscntItem.siteId, search.getSiteId())); // 사이트ID
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmDiscntItemDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmDiscntItemDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmDiscntItem.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmDiscntItemDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "discntId,discntItemId,targetId,targetTypeCd" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("discntId", pmDiscntItem.discntId), // 할인ID 필터 (pm_discnt.discnt_id)
            QdslUtil.FieldDef.like("discntItemId", pmDiscntItem.discntItemId), // 할인항목ID 필터
            QdslUtil.FieldDef.like("targetId", pmDiscntItem.targetId), // 대상ID 필터 (category_id/prod_id/grade_cd)
            QdslUtil.FieldDef.like("targetTypeCd", pmDiscntItem.targetTypeCd) // 대상유형 필터
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("discntItemId", pmDiscntItem.discntItemId,
                   "regDate", pmDiscntItem.regDate),
        new OrderSpecifier<>(Order.DESC, pmDiscntItem.regDate),
        new OrderSpecifier<>(Order.ASC, pmDiscntItem.discntItemId));
    }

    /* 할인 대상 상품 수정 */
    @Override
    public int updateSelective(PmDiscntItem entity) {
        if (entity.getDiscntItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmDiscntItem);
        boolean hasAny = false;

        if (entity.getDiscntId()    != null) { update.set(pmDiscntItem.discntId,    entity.getDiscntId());    hasAny = true; }
        if (entity.getTargetTypeCd()!= null) { update.set(pmDiscntItem.targetTypeCd,entity.getTargetTypeCd());hasAny = true; }
        if (entity.getTargetId()    != null) { update.set(pmDiscntItem.targetId,    entity.getTargetId());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmDiscntItem.discntItemId.eq(entity.getDiscntItemId())).execute();
        return (int) affected;
    }
}
